const url = 'http://20.207.122.201/evaluation-service/notifications';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2aW5lZWxhX2d1amphcmxhcHVkaUBzcm1hcC5lZHUuaW4iLCJleHAiOjE3Nzc2OTg2NDQsImlhdCI6MTc3NzY5Nzc0NCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjU1NTA3MWZmLTlhNDMtNDAwMC1hNjVlLTdmNGY0ZGJkZGUxMSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZpbmVlbGEgZ3VqamFybGFwdWRpIiwic3ViIjoiNzU5YTQzMDEtZTM4MC00NGFiLWI2MmYtYzE0MDQxZmI4OGZmIn0sImVtYWlsIjoidmluZWVsYV9ndWpqYXJsYXB1ZGlAc3JtYXAuZWR1LmluIiwibmFtZSI6InZpbmVlbGEgZ3VqamFybGFwdWRpIiwicm9sbE5vIjoiYXAyMzExMDAxMTY0NCIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6Ijc1OWE0MzAxLWUzODAtNDRhYi1iNjJmLWMxNDA0MWZiODhmZiIsImNsaWVudFNlY3JldCI6IkNmY2dwTWFqdnR4WVRXUFYifQ.VXAPRr8C71jmJhIFJ_6P6kUADynLTKh9TdObLAj6yzs';

(async () => {
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    console.log('STATUS', res.status);
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('BODY_JSON_START');
      console.log(JSON.stringify(json, null, 2));
      console.log('BODY_JSON_END');
    } catch (e) {
      console.log('BODY_TEXT_START');
      console.log(text);
      console.log('BODY_TEXT_END');
    }
  } catch (err) {
    console.error('FETCH_ERROR', err && err.message ? err.message : String(err));
    process.exit(2);
  }
})();
