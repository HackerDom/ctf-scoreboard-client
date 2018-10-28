var teams = document.getElementsByClassName("team");
for(var i = 0, len = teams.length; i < len; i++)
{
	(function (_i) {
		teams[_i].onclick = function () {
			if (teams[_i].classList.contains("team_selected"))
				teams[_i].classList.remove("team_selected");
			else
				teams[_i].classList.add("team_selected")
		};
	})(i);
}
initResize();
function initResize() {
	var zoom = 1;
	var header = document.getElementById("header");
	var width = parseInt(header.style.width);
	var headerContainer = document.getElementById("header-container");
	var scoreboard = document.getElementById("scoreboard");
	function resize() {
		var container = document.getElementById('container');
		if(container !== null) {
			if (window.outerWidth < width) {
				zoom = (window.outerWidth - 40) / width;
				container.setAttribute("style", "transform:scale(" + zoom + ");");
			} else {
				zoom = 1;
				container.setAttribute("style", "");
			}
			headerContainer.style.width = (container.offsetWidth / zoom) + "px";
			scoreboard.style.width = (container.offsetWidth / zoom) + "px";
		}
	}
	window.onresize = function() {
		resize();
	};
	resize();
}