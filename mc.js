onmessage = function({data: state}) {
	const {chunk_size, wins, frequencies, ge_win_games_keys} = state
	const N = frequencies.length;
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
	let wins_ = {direct: Array(N).fill(0), sorted: Array(N).fill(0)};
	let bets = 0;
	const ge_win_games = {direct: Array(N), sorted: Array(N)};
	const ge_win_games_prob = {direct: Array(N), sorted: Array(N)};
	for (let i = 0; i < N; i++) {
		ge_win_games.direct[i] = {};
		ge_win_games.sorted[i] = {};
		ge_win_games_prob.direct[i] = {};
		ge_win_games_prob.sorted[i] = {};
		for (const k of ge_win_games_keys) {
			ge_win_games.direct[i][k] = ge_win_games.sorted[i][k] = ge_win_games_prob.direct[i][k] = ge_win_games_prob.sorted[i][k] = 0;
		}
	}
	while (true) {
		let win_in_game = {direct: Array(N), sorted: Array(N)};
		for (let i = 0; i < chunk_size; i++) {
			win_in_game.direct.fill(0);
			win_in_game.sorted.fill(0);
			const won = wws.map(ws => ws[(Math.random() * ws.length)|0]|0);
			for (let i = 0; i < won.length; i++) {
				for (let j = i; j < won.length; j++) {
					wins_.direct[j] += won[i]/100.0;
					win_in_game.direct[j] += won[i];
				}
			}
			won.sort((a,b) => b-a);
			for (let i = 0; i < won.length; i++) {
				for (let j = i; j < won.length; j++) {
					wins_.sorted[j] += won[i]/100.0;
					win_in_game.sorted[j] += won[i];
				}
			}
			for (const k of ge_win_games_keys) {
				for (let i = 0; i < won.length; i++) {
					if (win_in_game.direct[i] >= k) ge_win_games.direct[i][k] += 1;
					if (win_in_game.sorted[i] >= k) ge_win_games.sorted[i][k] += 1;
				}
			}
		}
		bets += chunk_size;
		for (const k of ge_win_games_keys) {
			for (let i = 0; i < N; i++) {
				ge_win_games_prob.direct[i][k] = ge_win_games.direct[i][k]/bets;
				ge_win_games_prob.sorted[i][k] = ge_win_games.sorted[i][k]/bets;
			}
		}
		const rtp = {
			direct: wins_.direct.map(v => v/bets),
			sorted: wins_.sorted.map(v => v/bets),
		};
		postMessage({wins: wins_, bets, rtp, ge_win_games, ge_win_games_prob});
	}
}
