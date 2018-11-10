initResize();
function initResize() {
	var zoom = 1;
	var header = document.getElementById("header");
	var width = parseInt(header.style.width);
	var isFirefox = typeof InstallTrigger !== 'undefined';
	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;
	var headerContainer = document.getElementById("header-container");
	var scoreboard = document.getElementById("scoreboard");
	function resize() {
		const container = document.getElementById('container');
		if(container !== null && !isIE) {
			if (window.outerWidth < width) {
				zoom = (window.outerWidth - 40) / width;
				if(isFirefox)
					container.setAttribute("style", "transform:scale(" + zoom + ");");
				else
					container.setAttribute("style", "zoom:" + zoom + ";");
			} else {
				zoom = 1;
				container.setAttribute("style", "");
			}
			const headerContainerWidth =
				isFirefox
					? container === null
						? width + "px"
						: (container.offsetWidth / zoom) + "px"
					: "100%";
			const scoreboardWidth =
				isFirefox
					? container === null
						? width + "px"
						: (container.offsetWidth / zoom) + "px"
					: "auto";
			headerContainer.style.width = headerContainerWidth;
			scoreboard.style.width = scoreboardWidth;
		}
	}
	window.onresize = function() {
		resize();
	};
	resize();
}

function initSelect(currentScriptElem) {
	var team = currentScriptElem.previousSibling;
	team.onclick = function () {
		if (team.classList.contains("team_selected"))
			team.classList.remove("team_selected");
		else
			team.classList.add("team_selected")
	};
}

// document.currentScript polyfill by Adam Miller

// MIT license

(function(document){
	var currentScript = "currentScript",
		scripts = document.getElementsByTagName('script'); // Live NodeList collection

	// If browser needs currentScript polyfill, add get currentScript() to the document object
	if (!(currentScript in document)) {
		Object.defineProperty(document, currentScript, {
			get: function(){

				// IE 6-10 supports script readyState
				// IE 10+ support stack trace
				try { throw new Error(); }
				catch (err) {

					// Find the second match for the "at" string to get file src url from stack.
					// Specifically works with the format of stack traces in IE.
					var i, res = ((/.*at [^\(]*\((.*):.+:.+\)$/ig).exec(err.stack) || [false])[1];

					// For all scripts on the page, if src matches or if ready state is interactive, return the script tag
					for(i in scripts){
						if(scripts[i].src == res || scripts[i].readyState == "interactive"){
							return scripts[i];
						}
					}

					// If no match, return null
					return null;
				}
			}
		});
	}
})(document);