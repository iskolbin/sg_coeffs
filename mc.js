onmessage = function({data: state}) {
	const CHUNK = 2<<20; 
	const {wins, frequencies} = state
	let rtp = 0.0;
	let wws = [];
	for (const freqs_line of frequencies) {
		let ws = [];
		for (let i = 0; i < freqs_line.length; i++) {
			for (let j = 0; j < freqs_line[i]; j++) {
				ws.push(wins[i]);
			}
		}
		wws.push(ws);
	}
	let wins_ = 0;
	let bets = 0;
	let ge_win_games = {
		50: 0,
		100: 0,
		150: 0,
		200: 0,
		250: 0,
		300: 0,
		500: 0,
		1000: 0,
		3000: 0,
		9000: 0,
	}
	const kk = Object.keys(ge_win_games);
	while (true) {
		for (let i = 0; i < CHUNK; i++) {
			let win_in_game = 0;
			for (const ws of wws) {
				if (ws.length === 0) continue;
				const win = ws[(Math.random() * ws.length)|0];
				wins_ += win / 100.0;
				win_in_game += win;
			}
			for (const k of kk) {
				if (win_in_game >= k) ge_win_games[k] += 1;
			}
		}
		bets += CHUNK;
		ge_win_games_prob = {}
		for (const [k,n] of Object.entries(ge_win_games)) {
			ge_win_games_prob[k] = n / bets;
		}
		postMessage({wins: wins_, bets, rtp: wins_/bets, ge_win_games, ge_win_games_prob});
	}
}
