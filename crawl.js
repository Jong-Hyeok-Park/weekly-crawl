(function () {
  // ① jQuery 로드
  const script = document.createElement('script');
  script.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
  script.onload = () => initCrawler();
  document.head.appendChild(script);

  function initCrawler() {
    const $ = window.jQuery;

    // ② 전주 월~금 기본값
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

    // ③ CSS 스타일 삽입
    $('<style>').text(`
      #wc-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 999998;
      }
      #wc-modal {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 460px; background: #f0f4f8; border-radius: 12px;
        padding: 24px; z-index: 999999; font-family: 'Segoe UI', sans-serif;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      #wc-modal h1 {
        font-size: 15px; font-weight: 700; color: #1a202c; margin-bottom: 16px;
      }
      .wc-close {
        float: right; cursor: pointer; color: #a0aec0;
        font-size: 18px; line-height: 1;
      }
      .wc-close:hover { color: #2d3748; }
      .wc-row {
        display: flex; gap: 10px; margin-bottom: 12px;
      }
      .wc-field {
        flex: 1; display: flex; flex-direction: column; gap: 4px;
      }
      .wc-field label {
        font-size: 11px; font-weight: 600; color: #718096;
      }
      .wc-field input[type="date"] {
        box-sizing: border-box;
        padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
        font-size: 13px; color: #2d3748; background: #fff; outline: none; width: 100%;
      }
      .wc-field input[type="date"]:focus {
        border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
      }
      #wc-startBtn {
        width: 100%; padding: 10px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; border: none; border-radius: 8px;
        font-size: 13px; font-weight: 600; cursor: pointer;
      }
      #wc-startBtn:hover { opacity: 0.9; }
      #wc-startBtn:disabled { opacity: 0.5; cursor: not-allowed; }
      #wc-status {
        margin-top: 12px; padding: 8px 12px; border-radius: 8px;
        font-size: 12px; font-weight: 600; display: none;
      }
      #wc-status.validating { background: #ebf8ff; color: #2b6cb0; display: block; }
      #wc-status.success    { background: #f0fff4; color: #276749; display: block; }
      #wc-status.error      { background: #fff5f5; color: #c53030; display: block; }
      #wc-resultWrap { margin-top: 12px; display: none; }
      #wc-resultWrap table {
        width: 100%; border-collapse: collapse; font-size: 12px;
        background: #fff; border-radius: 8px; overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      #wc-resultWrap th {
        background: #667eea; color: #fff; padding: 7px 10px;
        text-align: center; font-weight: 600;
      }
      #wc-resultWrap td {
        padding: 7px 10px; text-align: right; color: #2d3748;
        border-bottom: 1px solid #e2e8f0;
      }
      #wc-resultWrap td.wc-label { text-align: left; font-weight: 600; color: #718096; }
      #wc-resultWrap tr:last-child td { border-bottom: none; }
      #wc-copyBtn {
        margin-top: 10px; width: 100%; padding: 8px;
        background: #fff; border: 1px solid #667eea; border-radius: 8px;
        color: #667eea; font-size: 12px; font-weight: 600; cursor: pointer;
      }
      #wc-copyBtn:hover { background: #667eea; color: #fff; }
    `).appendTo('head');

    // ④ HTML 생성
    const html = `
      <div id="wc-overlay"></div>
      <div id="wc-modal">
        <h1>📊 주간보고 크롤러 <span class="wc-close">✕</span></h1>
        <div class="wc-row">
          <div class="wc-field">
            <label>시작일 (전주 월요일)</label>
            <input type="date" id="wc-startDate" value="${lastWeek.start}" />
          </div>
          <div class="wc-field">
            <label>종료일 (전주 금요일)</label>
            <input type="date" id="wc-endDate" value="${lastWeek.end}" />
          </div>
        </div>
        <button id="wc-startBtn">🚀 크롤링 시작</button>
        <div id="wc-status"></div>
        <div id="wc-resultWrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>전년누계</th>
                <th>금년누계</th>
                <th>전년주간</th>
                <th>금주주간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="wc-label">항목1</td>
                <td id="wc-r1c1"></td><td id="wc-r1c2"></td>
                <td id="wc-r1c3"></td><td id="wc-r1c4"></td>
              </tr>
              <tr>
                <td class="wc-label">항목2</td>
                <td id="wc-r2c1"></td><td id="wc-r2c2"></td>
                <td id="wc-r2c3"></td><td id="wc-r2c4"></td>
              </tr>
            </tbody>
          </table>
          <button id="wc-copyBtn">📋 클립보드에 복사</button>
        </div>
      </div>
    `;
    $('body').append(html);

    // ⑤ 닫기
    $(document).on('click', 'span.wc-close', () => {
      $('#wc-overlay, #wc-modal').remove();
      location.reload();
    });

    // ⑥ 크롤링 로직
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

    $('#wc-startBtn').on('click', async () => {
      const inputStart = $('#wc-startDate').val();
      const inputEnd = $('#wc-endDate').val();

      if (!inputStart || !inputEnd) {
        $('#wc-status').attr('class', 'error').text('❌ 시작일과 종료일을 모두 입력해주세요.');
        return;
      }
      if (new Date(inputStart) >= new Date(inputEnd)) {
        $('#wc-status').attr('class', 'error').text('❌ 종료일은 시작일보다 이후여야 합니다.');
        return;
      }

      $('#wc-startBtn').prop('disabled', true);
      $('#wc-resultWrap').hide();
      $('#wc-status').attr('class', 'validating').text('⏳ 검증 중...');

      // 검증
      for (const [label, url] of Object.entries(validationUrls)) {
        const got = await fetchStats(url);
        const expected = VALIDATION[label];
        if (got.val1 !== expected.val1 || got.val2 !== expected.val2) {
          $('#wc-status').attr('class', 'error')
            .text(`❌ 검증 실패 [${label}] 기댓값: ${expected.val1}/${expected.val2} 실제값: ${got.val1}/${got.val2}`);
          $('#wc-startBtn').prop('disabled', false);
          return;
        }
      }

      $('#wc-status').attr('class', 'validating').text('✅ 검증 통과! 크롤링 중...');

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
      $('#wc-r1c1').text(results["전년누계"].val1);
      $('#wc-r1c2').text(results["금년누계"].val1);
      $('#wc-r1c3').text(results["전년주간"].val1);
      $('#wc-r1c4').text(results["금주주간"].val1);
      $('#wc-r2c1').text(results["전년누계"].val2);
      $('#wc-r2c2').text(results["금년누계"].val2);
      $('#wc-r2c3').text(results["전년주간"].val2);
      $('#wc-r2c4').text(results["금주주간"].val2);

      lastOutput = [
        [results["전년누계"].val1, results["금년누계"].val1, "", results["전년주간"].val1, results["금주주간"].val1].join("\t"),
        [results["전년누계"].val2, results["금년누계"].val2, "", results["전년주간"].val2, results["금주주간"].val2].join("\t"),
      ].join("\n");

      $('#wc-status').attr('class', 'success').text('✅ 완료!');
      $('#wc-resultWrap').show();
      $('#wc-startBtn').prop('disabled', false);
    });

    // ⑦ 클립보드 복사
    $('#wc-copyBtn').on('click', async () => {
      await navigator.clipboard.writeText(lastOutput);
      $('#wc-copyBtn').text('✅ 복사완료!');
      setTimeout(() => $('#wc-copyBtn').text('📋 클립보드에 복사'), 2000);
    });
  }
})();
