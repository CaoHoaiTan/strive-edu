export const BODY_HTML = `
<div class="overlay-bg" id="overlayBg"></div>

<div class="app">
  <!-- ============ SIDEBAR ============ -->
  <aside class="sidebar" id="sidebar">
    <div class="brand">
      <div class="brand-mark">MC</div>
      <div class="brand-text">
        <div class="t1">Mission Control</div>
        <div class="t2">PSPO · PMP TRACKER</div>
      </div>
    </div>

    <div class="nav-item active" data-view="dashboard">
      <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>
      Executive Dashboard
    </div>
    <div class="nav-item" data-view="calendar">
      <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
      Learning Calendar
    </div>
    <div class="nav-item" data-view="resources">
      <svg class="icon" viewBox="0 0 24 24"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18Z"/><path d="M20 17H6.5A2.5 2.5 0 0 0 4 19.5"/></svg>
      Resource Library
    </div>
    <div class="nav-item" data-view="mockexam">
      <svg class="icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      Mock Exam Analytics
    </div>
    <div class="nav-item" data-view="planner">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
      Daily Planner
    </div>
    <div class="nav-item" data-view="analytics">
      <svg class="icon" viewBox="0 0 24 24"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>
      Analytics
    </div>
    <div class="nav-item" data-view="errorlog">
      <svg class="icon" viewBox="0 0 24 24"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/></svg>
      Error Log
    </div>

    <div class="nav-section-label">Data</div>
    <div class="nav-item" id="btnExportData">
      <svg class="icon" viewBox="0 0 24 24"><path d="M12 3v13m0 0-4-4m4 4 4-4"/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/></svg>
      Export JSON
    </div>
    <div class="nav-item" id="btnResetData">
      <svg class="icon" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
      Reset dữ liệu
    </div>

    <div class="sidebar-foot">
      <div class="theme-toggle">
        <span class="small" style="font-family:var(--font-mono)">☾ / ☀ Theme</span>
        <div class="switch on" id="themeSwitch"></div>
      </div>
    </div>
  </aside>

  <!-- ============ MAIN ============ -->
  <main class="main">
    <div class="topbar">
      <div class="flex center gap12">
        <div class="hamburger" id="hamburger">
          <svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </div>
        <div>
          <h1 id="pageTitle">Executive Dashboard</h1>
          <div class="sub" id="pageSub">Tổng quan hành trình chinh phục PSPO &amp; PMP</div>
        </div>
      </div>
      <div class="flex gap8 center">
        <span class="tag tag-pspo" id="pspoCountdownTag">PSPO —d</span>
        <span class="tag tag-pmp" id="pmpCountdownTag">PMP —d</span>
      </div>
    </div>

    <!-- ============ DASHBOARD ============ -->
    <section class="view active" id="view-dashboard">
      <div class="grid g4">
        <div class="glass kpi">
          <span class="eyebrow">Overall Progress</span>
          <div class="ring-wrap">
            <svg width="66" height="66" viewBox="0 0 66 66" id="ringOverall"></svg>
            <div>
              <div class="ring-num" id="overallPct">0%</div>
              <div class="small" id="overallSub">0 / 0 tasks</div>
            </div>
          </div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Study Streak</span>
          <div class="val" id="streakVal">0 ngày 🔥</div>
          <div class="delta flat" id="streakSub">Chưa có dữ liệu học</div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Learning Velocity</span>
          <div class="val" id="velocityVal">0.0</div>
          <div class="delta flat" id="velocitySub">task / ngày (7 ngày gần nhất)</div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Risk Indicator</span>
          <div class="mt8"><span class="risk-pill risk-green" id="riskPill"><span class="dot"></span> ON TRACK</span></div>
          <div class="small mt8" id="riskSub">Đang tính toán...</div>
        </div>
      </div>

      <div class="grid g2 mt18">
        <div class="glass card">
          <h3>PSPO Progress</h3>
          <div class="desc" id="pspoExamDateLabel">Ngày thi: —</div>
          <div class="ring-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90" id="ringPspo"></svg>
            <div>
              <div class="ring-num" id="pspoPct">0%</div>
              <div class="small" id="pspoSub">0 / 0 tasks hoàn thành</div>
              <div class="small mt8" id="pspoCountdownFull">— ngày còn lại</div>
            </div>
          </div>
        </div>
        <div class="glass card">
          <h3>PMP Progress</h3>
          <div class="desc" id="pmpExamDateLabel">Ngày thi: —</div>
          <div class="ring-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90" id="ringPmp"></svg>
            <div>
              <div class="ring-num" id="pmpPct">0%</div>
              <div class="small" id="pmpSub">0 / 0 tasks hoàn thành</div>
              <div class="small mt8" id="pmpCountdownFull">— ngày còn lại</div>
            </div>
          </div>
        </div>
      </div>

      <div class="glass card mt18">
        <div class="section-title">
          <div>
            <h3>Burn-up / Burn-down Chart</h3>
            <div class="desc">Task hoàn thành lũy kế (burn-up) so với task còn lại (burn-down), toàn bộ 183 ngày lộ trình.</div>
          </div>
          <div class="legend">
            <span><span class="legend-dot" style="background:var(--accent)"></span>Burn-up (đã làm)</span>
            <span><span class="legend-dot" style="background:var(--red)"></span>Burn-down (còn lại)</span>
            <span><span class="legend-dot" style="background:var(--text-2)"></span>Ideal</span>
          </div>
        </div>
        <canvas id="chartBurn" height="230"></canvas>
      </div>

      <div class="grid g2 mt18">
        <div class="glass card">
          <h3>KPI theo tuần</h3>
          <div class="desc">Số task hoàn thành mỗi tuần trong 8 tuần gần nhất</div>
          <canvas id="chartWeeklyKpi" height="200"></canvas>
        </div>
        <div class="glass card">
          <h3>Giờ học theo tuần</h3>
          <div class="desc">Tổng số giờ học ghi nhận mỗi tuần</div>
          <canvas id="chartWeeklyHours" height="200"></canvas>
        </div>
      </div>
    </section>

    <!-- ============ CALENDAR ============ -->
    <section class="view" id="view-calendar">
      <div class="glass card">
        <div class="cal-toolbar">
          <div class="flex gap8 center">
            <button class="btn btn-sm" id="calPrev">‹</button>
            <div style="font-family:var(--font-mono); font-weight:700; font-size:13px; min-width:150px; text-align:center;" id="calMonthLabel">—</div>
            <button class="btn btn-sm" id="calNext">›</button>
            <button class="btn btn-sm" id="calToday">Hôm nay</button>
          </div>
          <div class="flex gap8">
            <div class="filter-chip active-all" data-filter="all">Tất cả</div>
            <div class="filter-chip" data-filter="PSPO">PSPO</div>
            <div class="filter-chip" data-filter="PMP">PMP</div>
          </div>
        </div>
        <div class="cal-grid" id="calDow"></div>
        <div class="cal-grid mt8" id="calGrid"></div>
        <div class="small mt14">💡 Kéo–thả (drag &amp; drop) một task từ ô ngày này sang ô ngày khác để dời lịch học. Click vào ô ngày để xem chi tiết &amp; thêm task.</div>
      </div>
    </section>

    <!-- ============ RESOURCES ============ -->
    <section class="view" id="view-resources">
      <div class="section-title">
        <div>
          <h2>Resource Library</h2>
          <div class="desc">Tài liệu &amp; nguồn học chính thức cho PSPO và PMP — tick khi hoàn thành.</div>
        </div>
        <button class="btn btn-primary" id="btnAddResource">+ Thêm tài liệu</button>
      </div>
      <div class="grid g3" id="resourceGrid"></div>
    </section>

    <!-- ============ MOCK EXAM ============ -->
    <section class="view" id="view-mockexam">
      <div class="grid g2">
        <div class="glass card">
          <h3>Ghi nhận kết quả thi thử</h3>
          <div class="desc">Nhập điểm mỗi lần làm mock exam để theo dõi xu hướng</div>
          <div class="field">
            <label>Chứng chỉ</label>
            <select id="examCertSelect">
              <option value="PSPO">PSPO</option>
              <option value="PMP">PMP</option>
            </select>
          </div>
          <div class="field">
            <label>Ngày thi thử</label>
            <input type="date" id="examDateInput">
          </div>
          <div class="field">
            <label>Điểm tổng (%)</label>
            <input type="number" id="examScoreInput" min="0" max="100" placeholder="VD: 78">
          </div>
          <div id="examDomainInputs"></div>
          <button class="btn btn-primary" id="btnAddExam" style="width:100%; margin-top:6px;">+ Lưu kết quả</button>
        </div>
        <div class="glass card">
          <h3>Radar Chart theo Domain</h3>
          <div class="desc">Điểm trung bình theo từng domain (dựa trên các lần thi đã lưu)</div>
          <div class="field" style="max-width:200px;">
            <select id="radarCertSelect">
              <option value="PSPO">PSPO</option>
              <option value="PMP">PMP</option>
            </select>
          </div>
          <canvas id="chartRadar" height="230"></canvas>
        </div>
      </div>

      <div class="glass card mt18">
        <h3>Xu hướng điểm theo thời gian</h3>
        <div class="desc">Đường xu hướng điểm số của tất cả các lần thi thử</div>
        <canvas id="chartExamTrend" height="200"></canvas>
      </div>

      <div class="grid g2 mt18">
        <div class="glass card">
          <h3>Lịch sử các lần thi</h3>
          <div id="examHistoryList"></div>
        </div>
        <div class="glass card">
          <h3>Heatmap chủ đề yếu</h3>
          <div class="desc">Số lần sai theo domain (dữ liệu lấy từ Error Log)</div>
          <div class="heat-grid" id="heatGrid"></div>
        </div>
      </div>
    </section>

    <!-- ============ PLANNER ============ -->
    <section class="view" id="view-planner">
      <div class="glass card">
        <div class="planner-day-nav">
          <button class="btn btn-sm" id="plannerPrev">‹</button>
          <div>
            <div class="planner-date-big" id="plannerDateBig">—</div>
            <div class="planner-date-sub" id="plannerDateSub">—</div>
          </div>
          <button class="btn btn-sm" id="plannerNext">›</button>
          <button class="btn btn-sm" id="plannerTodayBtn">Hôm nay</button>
          <span class="tag" id="plannerExamTag" style="display:none;"></span>
        </div>

        <div id="plannerTaskList"></div>
        <div class="add-task-row">
          <input type="text" id="plannerNewTaskText" placeholder="Thêm task mới cho ngày này...">
          <select id="plannerNewTaskCert" style="max-width:110px;">
            <option value="PSPO">PSPO</option>
            <option value="PMP">PMP</option>
          </select>
          <button class="btn btn-primary btn-sm" id="plannerAddTaskBtn">+ Thêm</button>
        </div>

        <div class="grid g2 mt18">
          <div class="field">
            <label>Số giờ học hôm nay</label>
            <div class="hours-slider-wrap">
              <input type="range" id="plannerHoursSlider" min="0" max="12" step="0.5" value="0">
              <span class="tag" id="plannerHoursVal" style="min-width:44px; text-align:center;">0h</span>
            </div>
          </div>
          <div class="field">
            <label>Ghi chú trong ngày</label>
            <input type="text" id="plannerNoteInput" placeholder="Cảm nhận, khó khăn, điểm cần ôn lại...">
          </div>
        </div>
      </div>
    </section>

    <!-- ============ ANALYTICS ============ -->
    <section class="view" id="view-analytics">
      <div class="grid g4">
        <div class="glass kpi">
          <span class="eyebrow">Tổng số giờ học</span>
          <div class="val" id="anTotalHours">0h</div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Average Hours / Day</span>
          <div class="val" id="anAvgHours">0.0h</div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Average Score</span>
          <div class="val" id="anAvgScore">—</div>
        </div>
        <div class="glass kpi">
          <span class="eyebrow">Predicted Pass Rate</span>
          <div class="val" id="anPassRate">—</div>
        </div>
      </div>

      <div class="glass card mt18">
        <h3>Completion Forecast</h3>
        <div class="desc">Dự báo ngày hoàn thành toàn bộ kế hoạch dựa trên tốc độ học hiện tại (velocity)</div>
        <div class="grid g2 mt14">
          <div>
            <div class="small">PSPO</div>
            <div class="ring-num" id="forecastPspo" style="font-size:16px;">—</div>
          </div>
          <div>
            <div class="small">PMP</div>
            <div class="ring-num" id="forecastPmp" style="font-size:16px;">—</div>
          </div>
        </div>
      </div>

      <div class="glass card mt18">
        <h3>% Hoàn thành theo từng Domain</h3>
        <div class="desc">Tính theo tỉ lệ task liên quan tới domain đã hoàn thành (gán qua Error Log &amp; Mock Exam)</div>
        <canvas id="chartDomainCompletion" height="220"></canvas>
      </div>
    </section>

    <!-- ============ ERROR LOG ============ -->
    <section class="view" id="view-errorlog">
      <div class="glass card">
        <div class="section-title">
          <div>
            <h2 style="font-size:16px;">Error Log</h2>
            <div class="desc">Ghi lại mỗi câu hỏi làm sai để phân tích root-cause &amp; hành động khắc phục</div>
          </div>
        </div>
        <div class="grid el-form-grid" style="grid-template-columns:100px 90px 1fr 1fr 1fr 1fr 40px; gap:8px; margin-bottom:14px;">
          <input type="date" id="elDate">
          <select id="elCert"><option value="PSPO">PSPO</option><option value="PMP">PMP</option></select>
          <input type="text" id="elDomain" placeholder="Domain">
          <input type="text" id="elQuestion" placeholder="Câu hỏi / chủ đề sai">
          <input type="text" id="elRoot" placeholder="Root cause">
          <input type="text" id="elAction" placeholder="Hành động khắc phục">
          <button class="btn btn-primary btn-sm" id="btnAddError">+</button>
        </div>
        <div class="table-wrap">
          <table id="errorLogTable">
            <thead><tr><th>Date</th><th>Certificate</th><th>Domain</th><th>Question</th><th>Root Cause</th><th>Action</th><th></th></tr></thead>
            <tbody id="errorLogBody"></tbody>
          </table>
        </div>
      </div>
    </section>

  </main>
</div>

<!-- ============ DAY MODAL ============ -->
<div class="modal-backdrop" id="dayModalBackdrop">
  <div class="glass modal">
    <div class="modal-head">
      <div>
        <h3 id="dayModalTitle">—</h3>
        <div class="small" id="dayModalSub">—</div>
      </div>
      <div class="close-x" id="dayModalClose">✕</div>
    </div>
    <div id="dayModalTaskList"></div>
    <div class="add-task-row">
      <input type="text" id="dayModalNewTaskText" placeholder="Thêm task...">
      <select id="dayModalNewTaskCert" style="max-width:100px;">
        <option value="PSPO">PSPO</option>
        <option value="PMP">PMP</option>
      </select>
      <button class="btn btn-primary btn-sm" id="dayModalAddBtn">+</button>
    </div>
  </div>
</div>

<!-- ============ RESOURCE MODAL ============ -->
<div class="modal-backdrop" id="resModalBackdrop">
  <div class="glass modal">
    <div class="modal-head">
      <h3>Thêm tài liệu</h3>
      <div class="close-x" id="resModalClose">✕</div>
    </div>
    <div class="field"><label>Tên tài liệu</label><input type="text" id="resNameInput"></div>
    <div class="field"><label>Chứng chỉ</label>
      <select id="resCertInput"><option value="PSPO">PSPO</option><option value="PMP">PMP</option><option value="Both">Cả hai</option></select>
    </div>
    <div class="field"><label>Loại</label>
      <select id="resTypeInput"><option value="doc">Tài liệu</option><option value="video">Video</option><option value="course">Khóa học</option></select>
    </div>
    <div class="field"><label>Link (tuỳ chọn)</label><input type="text" id="resLinkInput" placeholder="https://..."></div>
    <button class="btn btn-primary" id="resSaveBtn" style="width:100%;">Lưu</button>
  </div>
</div>
`;
