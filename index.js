const FLOAT_DIGITS = 3;

const byId = (id) => document.getElementById(id);

const root = () => byId("content");

const element = (element, attributes = {}, innerHTML = undefined) => {
	const e = document.createElement(element);
	for (const [a, v] of Object.entries(attributes)) {
		e.setAttribute(a, v);
	}
	if (innerHTML) {
		e.innerHTML = innerHTML;
	}
	return e;
}


let worker = null;
const createTable = (id, header, lines) => element("div", {id, "class": "table-container"}); 
const updateTable = (id, header, lines, callback) => byId(id).innerHTML = `
<table class="table table_shrink is-stripped is-hoverable">
	<thead><tr>${header.map(h => "<th>" + h + "</th>").join("")}</tr></thead>
	<tbody>${lines.map((l,i) => "<tr>" + l.map((v,j) => "<td><input style=\"max-width:40px\" id=\"coeff_" + i + "_" + j + "\" class=\"is-small\" type=\"text\" value=\"" + v + "\" onchange=\"" + callback + "(parseInt(byId('coeff_" + i + "_" + j + "').value), " + i + ", " + j + ");\"></td>").join("") + "</tr>").join("")}</tbody>
</table>`;

let state = {
	wins: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 400, 500, 600, 800, 1000, 2000, 9000],
	frequencies: [
		[100,8, 6, 4,  3, 0, 0, 0, 0, 0, 0,   0,  0, 0, 0,   0,   0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0,  0, 0,100, 8, 7, 7, 6, 5, 3, 1,   0,  0, 0, 0,   0,   0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0,  0, 0, 0,100,90, 8, 7, 7, 7, 7,   5,  4, 3, 2,   1,   0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0,  0, 0, 0,  0, 0, 0, 0, 0, 0, 0,1000,900, 9, 9,   8,   8,  7, 6, 5, 4, 4, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
		[0,  0, 0, 0,  0, 0, 0, 0, 0, 0, 0,   0,  0, 0, 0,4300,2500,140,13,12,11,10,10, 9, 8, 5, 4, 3, 2, 1, 1, 1]
	],
};

const updateCoeffs = (v, i, j) => {
	if (String(v) === "NaN") return;	
	state.frequencies[i][j] = v
	updateRTP("rtp", state.wins, state.frequencies);
	if (worker) worker.terminate();
	worker = new Worker("mc.js");
	worker.postMessage(state);
	byId("json_coeffs").innerHTML = JSON.stringify(state.frequencies);
	worker.onmessage = function({data:{rtp, ge_win_games_prob}}) {
		byId("mc").innerHTML = `${rtp*100.0}%`;
		byId("log").innerHTML = Object.entries(ge_win_games_prob).map(([k, prob]) => `<b>>=${k}</b> ${(prob*100).toFixed(FLOAT_DIGITS)}%<br>`).join("\n");
	}
}

const coeffs_section = element("section", {"class": "section"});
coeffs_section.appendChild(createTable("coeffs"));

const rtp_element = element("div", {}, "RTP ");
rtp_element.appendChild(element("span", {"id": "rtp", "class": "tag is-primary is-medium"}));

const mc_element = element("div", {}, "MC  ");
mc_element.appendChild(element("span", {"id": "mc", "class": "tag is-info is-medium"}));

const log = element("div", {"id":"log"});

const json_coeffs = element("div", {"id":"json_coeffs"});

const rtp_section = element("section", {"class": "section"});
rtp_section.appendChild(rtp_element);
rtp_section.appendChild(mc_element);
rtp_section.appendChild(log);
rtp_section.appendChild(json_coeffs);

const updateRTP = (id, wins, frequencies) => {
	const rtp_ = frequencies.reduce((rtp, line) => {
		const n = line.reduce((s, freq) => s + freq, 0);
		return rtp + line.reduce((s, freq, i) => s + freq * wins[i] / (n * 100.0), 0);
	}, 0)
	byId(id).innerHTML = `${rtp_*100.0}%`;
}

byId("content").appendChild(coeffs_section);
byId("content").appendChild(rtp_section);
updateTable("coeffs", state.wins, state.frequencies, "updateCoeffs");
updateCoeffs(state.frequencies[0][0], 0, 0);
