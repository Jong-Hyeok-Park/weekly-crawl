// 전주 월~금 기본값
const getLastWeek = () => {
  const today = new Date();
  const day = today.getDay();
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastFriday = new Date(lastMonday);
  lastFriday.setDate(lastMonday.getDate() + 4);
  const fmt = (d) => d.toISOString().split('T')[0];
  return { start: fmt(lastMonday), end: fmt(lastFriday) };
};

const lastWeek = getLastWeek();
document.getElementById('startDate').value = lastWeek.start;
document.getElementById('endDate').value = lastWeek.end;

const formatDate = (date) => date.toISOString().split('T')[0];

const fetchStats = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tds = doc.querySelectorAll("table.summaryTableTop tr:nth-child(2) td");
  return {
    val1: tds[1]?.querySelector("span")?.textContent.trim() ?? "",
    val2: tds[5]?.querySelector("span")?.textContent.trim() ?? "",
  };
};

const VALIDATION = {
  "전년누계": { val1: "3,378,895", val2: "1,887,810" },
  "금년누계": { val1: "4,116,273", val2: "2,359,883" },
  "전년주간": { val1: "70,235",    val2: "37,163"    },
  "금주주간": { val1: "78,741",    val2: "51,540"    },
};

const validationUrls = {
  "전년누계": "https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=2025-01-01&end_date=2025-06-19",
  "금년누계": "https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=2026-01-01&end_date=2026-06-19",
  "전년주간": "https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=2025-06-15&end_date=2025-06-19",
  "금주주간": "https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=2026-06-15&end_date=2026-06-19",
};

let lastOutput = "";

document.getElementById('startBtn').addEventListener('click', async () => {
  const inputStart = document.getElementById('startDate').value;
  const inputEnd = document.getElementById('endDate').value;
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('startBtn');
  const resultWrap = document.getElementById('resultWrap');

  // 유효성 체크
  if (!inputStart || !inputEnd) {
    statusEl.className = 'error';
    statusEl.textContent = '❌ 시작일과 종료일을 모두 입력해주세요.';
    return;
  }
  if (new Date(inputStart) >= new Date(inputEnd)) {
    statusEl.className = 'error';
    statusEl.textContent = '❌ 종료일은 시작일보다 이후여야 합니다.';
    return;
  }

  startBtn.disabled = true;
  resultWrap.style.display = 'none';
  statusEl.className = 'validating';
  statusEl.textContent = '⏳ 검증 중...';

  // 검증
  for (const [label, url] of Object.entries(validationUrls)) {
    const got = await fetchStats(url);
    const expected = VALIDATION[label];
    if (got.val1 !== expected.val1 || got.val2 !== expected.val2) {
      statusEl.className = 'error';
      statusEl.textContent = `❌ 검증 실패 [${label}] 기댓값: ${expected.val1}/${expected.val2} 실제값: ${got.val1}/${got.val2}`;
      startBtn.disabled = false;
      return;
    }
  }

  statusEl.className = 'validating';
  statusEl.textContent = '✅ 검증 통과! 크롤링 중...';

  // 날짜 계산
  const A1 = new Date(inputEnd);
  const B1 = new Date(inputStart);
  const A2 = new Date(A1); A2.setFullYear(A1.getFullYear() - 1);
  const B2 = new Date(B1); B2.setFullYear(B1.getFullYear() - 1);

  const targets = {
    "전년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A2.getFullYear()}-01-01&end_date=${formatDate(A2)}`,
    "금년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A1.getFullYear()}-01-01&end_date=${formatDate(A1)}`,
    "전년주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate(B2)}&end_date=${formatDate(A2)}`,
    "금주주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate(B1)}&end_date=${formatDate(A1)}`,
  };

  const results = {};
  for (const [label, url] of Object.entries(targets)) {
    results[label] = await fetchStats(url);
  }

  // 테이블 채우기
  document.getElementById('r1c1').textContent = results["전년누계"].val1;
  document.getElementById('r1c2').textContent = results["금년누계"].val1;
  document.getElementById('r1c3').textContent = results["전년주간"].val1;
  document.getElementById('r1c4').textContent = results["금주주간"].val1;
  document.getElementById('r2c1').textContent = results["전년누계"].val2;
  document.getElementById('r2c2').textContent = results["금년누계"].val2;
  document.getElementById('r2c3').textContent = results["전년주간"].val2;
  document.getElementById('r2c4').textContent = results["금주주간"].val2;

  lastOutput = [
    [results["전년누계"].val1, results["금년누계"].val1, "", results["전년주간"].val1, results["금주주간"].val1].join("\t"),
    [results["전년누계"].val2, results["금년누계"].val2, "", results["전년주간"].val2, results["금주주간"].val2].join("\t"),
  ].join("\n");

  statusEl.className = 'success';
  statusEl.textContent = '✅ 완료!';
  resultWrap.style.display = 'block';
  startBtn.disabled = false;
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  await navigator.clipboard.writeText(lastOutput);
  document.getElementById('copyBtn').textContent = '✅ 복사완료!';
  setTimeout(() => document.getElementById('copyBtn').textContent = '📋 클립보드에 복사', 2000);
});