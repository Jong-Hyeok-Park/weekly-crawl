(async () => {
  // BASE_DATE = 오늘 -3일이 default
  const today = new Date();
  const defaultDate = new Date(today);
  defaultDate.setDate(today.getDate() - 3);
  const defaultStr = defaultDate.toISOString().split('T')[0];

  const input = prompt("기준날짜 입력\n예: 2026-06-19", defaultStr);
  if (!input) return;

  const formatDate = (date) => date.toISOString().split('T')[0];

  const BASE = new Date(input);
  const A1 = new Date(BASE);
  const B1 = new Date(BASE); B1.setDate(BASE.getDate() - 4);
  const A2 = new Date(BASE); A2.setFullYear(BASE.getFullYear() - 1);
  const B2 = new Date(B1);   B2.setFullYear(B1.getFullYear() - 1);

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
    "전년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A2.getFullYear()}-01-01&end_date=${formatDate(A2)}`,
    "금년누계": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${A1.getFullYear()}-01-01&end_date=${formatDate(A1)}`,
    "전년주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate(B2)}&end_date=${formatDate(A2)}`,
    "금주주간": `https://www.acecounter.com/stat/view/statview2_3.amz?srt_date=${formatDate(B1)}&end_date=${formatDate(A1)}`,
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
