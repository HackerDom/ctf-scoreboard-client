#!/usr/bin/env python3

import argparse
import json
import random
from bottle import route, run, response, static_file, hook
from functools import wraps
import datetime
import asyncio
import websockets
import threading

ROUNDS_PER_MINUTE = 2
ROUND_TIME = 60/ROUNDS_PER_MINUTE
GAME_LENGTH = 8
ROUNDS_COUNT = 8*60*ROUNDS_PER_MINUTE
service_names = ["atlablog", "weather", "cartographer", "sapmarine", "crash", "thebin", "theseven"]

def team_(x): return str(x)
def team_name(x): return '{}Переподвысмотрит'.format(x)
def service_(x): return str(x)

def utctime(): # число секунд
    now = datetime.datetime.utcnow()
    return int((now - datetime.datetime(1970, 1, 1)).total_seconds())
def cround(): return (utctime() - start)//ROUND_TIME + 1

connected = set()

scoreboards = []
currentRound = 0

_allow_origin = '*'
_allow_methods = 'PUT, GET, POST, DELETE, OPTIONS'
_allow_headers = 'Authorization, Origin, Accept, Content-Type, X-Requested-With'

@hook('after_request')
def enable_cors():
    '''Add headers to enable CORS'''

    response.headers['Access-Control-Allow-Origin'] = _allow_origin
    response.headers['Access-Control-Allow-Methods'] = _allow_methods
    response.headers['Access-Control-Allow-Headers'] = _allow_headers


@route('/<filepath:path>')
def main_page(filepath):
    response = static_file(filepath, root='./')
    response.set_header("Cache-Control", "no-cache")
    return response


def tojson(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        response.content_type = 'application/json'
        return fn(*args, **kwargs)

    return wrapper


@route('/api/info')
@tojson
def info_page():
    logo = "https://ructfe.org/media/uploads/2017/teams_logo/%D0%9F%D0%B5%D1%80%D0%B5%D0%BF%D0%BE%D0%B4%D0%B2%D1%8B%D1%81%D0%BC%D0%BE%D1%82%D1%80%D0%B8%D1%82"
    return {
        'teams': {team_(i): {
            'logo': logo,
            'name': team_name(i),
            'host': 'host'+str(i),
            'id': i,
            'network': 'host'+str(i)+'\\24'
        } for i in range(1, args.teams + 1)},
        'services': {service_(i + 1): service_names[i] for i in range(args.services)},
        'start': start,
        'end': start + GAME_LENGTH * 60 * 60,
        #'roundsCount': ROUNDS_COUNT
    }

def create_first_scoreboard():
    return {
            "round": 0,
            "scoreboard": [
                {
                    "name": team_name(t),
                    "team_id": t,
                    "score": "0.00",
                    "n": t,
                    "d": 0,
                    "services": [
                        {
                            "flags": 0,
                            "fp": 0.0,
                            "id": service_(s + 1),
                            "sla": 0.0,
                            "sflags": 0,
                            "status": 104,
                            "stdout": "stdout" + str(t) + '_' + str(s)

                        }
                        for s in range(args.services)
                    ]
                }
                for t in range(1, args.teams+1)
            ]
        }

def to2Signs(n):
    return round(n, 2)

def create_scoreboard():
    global currentRound
    if len(scoreboards) == 0:
        scoreboards.append(create_first_scoreboard())
        return scoreboards[0]
    prev = scoreboards[-1]
    currentRound += 1
    scoreboards.append({
        "round": currentRound,
        "scoreboard": [
            {
                "name": team_name(t),
                "team_id": t,
                "score": "{:.2f}".format(float(prev["scoreboard"][t - 1]["score"]) + random.uniform(-50, 100)),
                "n": t, # Constant order is used when accessing the previous one to simplify the test server
                "d": random.choice((1, 0, -1)),
                "services": [
                    {
                        "flags": prev["scoreboard"][t - 1]["services"][s-1]["flags"] + int(random.uniform(0, s)),
                        "fp": max(0, prev["scoreboard"][t - 1]["services"][s-1]["fp"] + to2Signs(random.uniform(-2, s*2))),
                        "id": s,
                        "sla": 10 + to2Signs(random.uniform(-10, s*10)),
                        "sflags": prev["scoreboard"][t - 1]["services"][s-1]["sflags"] + int(random.uniform(0, 2)),
                        "status": random.choice((101, 101, 101, 101, 101, 102, 103, 104, 110)),
                        "stdout": "stdout" + str(t) + '_' + str(s)

                    }
                    for s in range(1, args.services + 1)
                ]
            }
            for t in range(1, args.teams + 1)
        ]
    })
    return scoreboards[-1]

@route('/history/scoreboard.json')
def all_scoreboards():
    response.content_type = 'application/json'
    history = [{
        "round": s["round"],
        "scoreboard": [
            {
                "id": t["team_id"],
                "score": float(t["score"]),
                "services": [
                    {
                        "flags": ser["flags"],
                        "sflags": ser["sflags"],
                        "fp": ser["fp"],
                        "status": ser["status"]
                    } for ser in t["services"]
                ]
            } for t in s["scoreboard"]
        ]
    } for s in scoreboards]
    return json.dumps(history, separators=(',', ':'))


async def websockets_handler(websocket, path):
    global connected
    connected.add(websocket)
    await create_state()
    while True:
        await asyncio.sleep(1)
        if websocket not in connected:
            break


async def write_to_websocket(text):
    for ws in connected.copy():
        try:
            await ws.send(text)
        except:
            connected.remove(ws)



def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--teams', type=int, help='teams count',
                        default=26)
    parser.add_argument('-s', '--services', type=int, help='services count',
                        default=7)
    parser.add_argument('-m', '--start_minute', type=int, help='passed time in minutes',
                        default=3*60)
    return parser.parse_args()


def websocket_server_run():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(websockets_handler, '0.0.0.0', 8080)
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_server)
    asyncio.ensure_future(create_states(), loop=loop)
    loop.run_forever()


async def create_states():
    while True:
        await asyncio.sleep(ROUND_TIME)
        create_scoreboard()
        await create_state()
        if currentRound >= ROUNDS_COUNT:
            break


async def create_state():
    if len(scoreboards) == 0:
        return
    container = {
        "type": "state",
        "value": scoreboards[-1] if len(scoreboards) > 0 else None
    }
    json_str = json.dumps(container, separators=(',', ':'))
    await write_to_websocket(json_str)

if __name__ == '__main__':
    args = parse_args()
    start = utctime() - args.start_minute * 60
    events = []
    scores = {team_(i): 0 for i in range(args.teams)}
    for r in range(int(cround() - 1)):
        create_scoreboard()
    thread = threading.Thread(target=websocket_server_run)
    thread.start()

    run(host='0.0.0.0', port=8000, debug=True, reloader=False)
