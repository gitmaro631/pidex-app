// Pi 플랫폼 API로 accessToken을 검증해 진짜 로그인된 username을 돌려준다.
// 클라이언트가 보낸 username 문자열은 절대 신뢰하지 말고, 이 함수가 돌려주는 값만 신뢰할 것.
export async function verifyPiUser(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null;
  try {
    const res = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-API-Key': process.env.PI_NETWORK_API_KEY ?? '',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.username || null;
  } catch {
    return null;
  }
}
