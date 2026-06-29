(async () => {
  const formatDate = (date) => date.toISOString().split('T')[0];

  const isValidDate = (str) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d) && formatDate(d) === str;
  };

  // 전주 월~금 기본값 계산
  const getLastWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0=일, 1=월 ... 6=토
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastFriday = new Date(lastMonday);
    lastFriday.setDate(lastMonday.getDate() + 4);
    return { start: formatDate(lastMonday), end: formatDate(lastFriday) };
  };

  const lastWeek = getLastWeek();

  // 시작일 입력
  const inputStart = prompt("주간 시작일 (전주 월요일)\n형식: YYYY-MM-DD", lastWeek.start);
  if (!inputStart) return;
  if (!isValidDate(inputStart)) {
    alert("❌ 시작일 형식이 올바르지 않습니다.\n예: 2026-06-22");
    return;
  }

  // 종료일 입력
  const inputEnd = prompt("주간 종료일 (전주 금요일)\n형식: YYYY-MM-DD", lastWeek.end);
  if (!inputEnd) return;
  if (!isValidDate(inputEnd)) {
    alert("❌ 종료일 형식이 올바르지 않습니다.\n예: 2026-06-26");
    return;
  }

  // 시작일 < 종료일 체크
  if (new Date(inputStart) >= new Date(inputEnd)) {
    alert("❌ 종료일은 시작일보다 이후여야 합니다.");
    return;
  }

  const formatDate2 = (date) => date.toISOString().split('T')[0];

  const A1 = new Date(inputEnd);
  const B1 = new Date(inputStart);
  const A2 = new Date(A1); A2.setFullYear(A1.getFullYear() - 1);
  const B2 = new Date(B1); B2.setFullYear(B1.getFullYear() - 1);

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

  // 검증
  console.log("⏳ 검증 중...");
  for (const [label, url] of Object.entries(validationUrls)) {
    const got = await fetchStats(url);
    const expected = VALIDATION[label];
    if (got.val1 !== expected.val1 || got.val2 !== expected.val2) {
      alert(`❌ 검증 실패 [${label}]\n기댓값: ${expected.val1} / ${expected.val2}\n실제값: ${got.val1} / ${got.val2}`);
      return;
    }
  }
  console.log("✅ 검증 통과!");

  // 실제 크롤링
  const targets = {
    "전년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A2.getFullYear()}-01-01&end_date=${formatDate2(A2)}`,
    "금년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A1.getFullYear()}-01-01&end_date=${formatDate2(A1)}`,
    "전년주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate2(B2)}&end_date=${formatDate2(A2)}`,
    "금주주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate2(B1)}&end_date=${formatDate2(A1)}`,
  };

  const results = {};
  for (const [label, url] of Object.entries(targets)) {
    results[label] = await fetchStats(url);
  }

  const row1 = [results["전년누계"].val1, results["금년누계"].val1, "", results["전년주간"].val1, results["금주주간"].val1].join("\t");
  const row2 = [results["전년누계"].val2, results["금년누계"].val2, "", results["전년주간"].val2, results["금주주간"].val2].join("\t");
  const output = row1 + "\n" + row2;

  await navigator.clipboard.writeText(output);
  alert("✅ 완료! 클립보드에 복사되었습니다.\n\n" + output);
})();
