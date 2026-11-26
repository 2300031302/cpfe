const API_BASE_URL = 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) throw new Error(`Chess API request failed: ${response.status}`)
  return response.json()
}

export async function checkBackend() { return request('/health') }
export async function analyzePosition(fen, move) {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ fen, ...(move ? { move } : {}) }),
  })
}
export async function createRemoteGame(fen) { return request('/games', { method: 'POST', body: JSON.stringify({ fen }) }) }
export async function predictRemoteMove(gameId) { return request(`/games/${gameId}/predict`) }
export async function submitRemoteMove(gameId, move) { return request(`/games/${gameId}/move`, { method: 'POST', body: JSON.stringify({ move }) }) }
export async function getRemoteGame(gameId) { return request(`/games/${gameId}`) }
