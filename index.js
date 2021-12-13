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
	ge_win_games_keys: [10, 50, 75, 100, 125, 150, 200, 250, 300, 500, 1000, 3000, 9000],
	chunk_size: 1<<16,
};

const rtp_str = (arr) => arr.map((v,i) => "<b>" + String(i+1) + "</b>:" + (v*100).toFixed(FLOAT_DIGITS) + "%").join(", ");

const updateFrequencies = (v, i, j) => {
	if (String(v) === "NaN") return;	
	state.frequencies[i][j] = v;
	updateRTP("rtp", state.wins, state.frequencies);
	if (worker) worker.terminate();
	worker = new Worker("mc.js");
	worker.postMessage(state);
	byId("state_json").value = JSON.stringify(state);
	worker.onmessage = function({data:{rtp, ge_win_games_prob}}) {
		byId("mc_direct").innerHTML = rtp_str(rtp.direct);
		byId("mc_sorted").innerHTML = rtp_str(rtp.sorted);
		byId("log").innerHTML = "<br><b>direct</b><br>" +
			"<div class=\"table-container\"><table class=\"table is-bordered is-narrow\">" +
			"<thead><tr><td><b>N</b></td><td><b>" + state.ge_win_games_keys.join("</b></td><td><b>") + "</b></td></thead></tr><tbody>" +
			ge_win_games_prob.direct.map((k_prob, i) => "<tr><td><b>" + (i+1) + "</b></td><td>" + state.ge_win_games_keys.map(k => (k_prob[k]*100).toFixed(3) + "%").join("</td><td>") + "</td></tr>").join("") +
			"</tbody></table></div>" +
			"<br><b>sorted</b><br>" +
			"<div class=\"table-container\"><table class=\"table is-bordered is-narrow\">" +
			"<thead><tr><td><b>N</b></td><td><b>" + state.ge_win_games_keys.join("</b></td><td><b>") + "</b></td></thead></tr><tbody>" +
			ge_win_games_prob.sorted.map((k_prob, i) => "<tr><td><b>" + (i+1) + "</b></td><td>" + state.ge_win_games_keys.map(k => (k_prob[k]*100).toFixed(3) + "%").join("</td><td>") + "</td></tr>").join("") +
			"</tbody></table></div><br>"
	}
}

const frequencies_section = element("section", {"class": "section"});
frequencies_section.appendChild(createTable("frequencies"));

const rtp_element = element("div", {}, "RTP max ");
rtp_element.appendChild(element("span", {"id": "rtp", "class": "tag is-primary is-medium"}));

const mcd_element = element("div", {}, "MC direct ");
mcd_element.appendChild(element("span", {"id": "mc_direct", "class": "tag is-info is-medium"}));
const mcs_element = element("div", {}, "MC sorted ");
mcs_element.appendChild(element("span", {"id": "mc_sorted", "class": "tag is-info is-medium"}));

const log = element("div", {"id":"log"});

const state_json = element("textarea", {"rows":5, "class": "textarea is-primary","id":"state_json"});
state_json.onchange = () => {
	state = JSON.parse(state_json.value);
	updateTable("frequencies", state.wins, state.frequencies, "updateFrequencies");
	updateFrequencies(state.frequencies[0][0], 0, 0);
}

const rtp_section = element("section", {"class": "section"});
rtp_section.appendChild(rtp_element);
rtp_section.appendChild(mcd_element);
rtp_section.appendChild(mcs_element);
rtp_section.appendChild(log);
rtp_section.appendChild(element("div", {}, "<b>State</b>"));
rtp_section.appendChild(state_json);

const updateRTP = (id, wins, frequencies) => {
	const rtp_ = frequencies.reduce((rtp, line) => {
		const n = line.reduce((s, freq) => s + freq, 0);
		if (n === 0) return rtp;
		return rtp + line.reduce((s, freq, i) => s + freq * wins[i] / (n * 100.0), 0);
	}, 0)
	byId(id).innerHTML = `${rtp_*100.0}%`;
}

byId("content").appendChild(frequencies_section);
byId("content").appendChild(rtp_section);
updateTable("frequencies", state.wins, state.frequencies, "updateFrequencies");
updateFrequencies(state.frequencies[0][0], 0, 0);
