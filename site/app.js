(() => {
  'use strict';

  const DATA_KEY = 'weekend-club-demo-v1';
  const PROFILE_KEY = 'weekend-club-demo-student';
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const categoryArt = {
    餐饮: { icon: '☕', tone: '' },
    零售: { icon: '▤', tone: 'orange' },
    活动: { icon: '✦', tone: 'green' }
  };

  const elements = {
    studentPanel: document.querySelector('#student-panel'),
    merchantPanel: document.querySelector('#merchant-panel'),
    roleStudent: document.querySelector('#role-student'),
    roleMerchant: document.querySelector('#role-merchant'),
    jobsPane: document.querySelector('#jobs-pane'),
    applicationsPane: document.querySelector('#applications-pane'),
    studentApplications: document.querySelector('#student-applications'),
    jobGrid: document.querySelector('#job-grid'),
    search: document.querySelector('#search'),
    payFilter: document.querySelector('#pay-filter'),
    resultCount: document.querySelector('#result-count'),
    empty: document.querySelector('#empty'),
    merchantJobs: document.querySelector('#merchant-jobs'),
    merchantEmpty: document.querySelector('#merchant-empty'),
    details: document.querySelector('#details'),
    detailContent: document.querySelector('#detail-content'),
    applyFromDetail: document.querySelector('#apply-from-detail'),
    applicationDialog: document.querySelector('#application-dialog'),
    applicationSummary: document.querySelector('#application-job-summary'),
    applyForm: document.querySelector('#apply-form'),
    studentName: document.querySelector('#student-name'),
    availability: document.querySelector('#availability'),
    profileDialog: document.querySelector('#profile-dialog'),
    profileForm: document.querySelector('#profile-form'),
    profileName: document.querySelector('#profile-name'),
    currentStudent: document.querySelector('#current-student'),
    postDialog: document.querySelector('#post-job-dialog'),
    postForm: document.querySelector('#post-job-form'),
    toast: document.querySelector('#toast')
  };

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function upcomingWeekend() {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return { saturday: toISODate(saturday), sunday: toISODate(sunday) };
  }

  function createSeedState() {
    const { saturday, sunday } = upcomingWeekend();
    return {
      version: 1,
      jobs: [
        { id: 'cafe-corner', title: '咖啡店周末店员', merchant: '转角咖啡', location: '大学城 · 校园东门附近', category: '餐饮', icon: '☕', tone: '', pay: 22, unit: '小时', dates: [saturday, sunday], startTime: '09:00', endTime: '17:00', headcount: 2, tags: ['无需经验', '提供培训'], description: '协助点单、饮品打包和店面整理。适合喜欢与人交流、愿意学习咖啡知识的同学。', settlement: '按实际工时结算（示例）' },
        { id: 'bookshop-page', title: '书店整理与收银', merchant: '一页书屋', location: '大学城 · 校园生活广场', category: '零售', icon: '▤', tone: 'orange', pay: 20, unit: '小时', dates: [saturday], startTime: '10:00', endTime: '18:00', headcount: 2, tags: ['室内工作', '环境安静'], description: '协助图书上架、整理陈列和收银引导。工作中需要细心核对书目与商品。', settlement: '工作结束后结算（示例）' },
        { id: 'market-creative', title: '周末市集活动协助', merchant: '校园创意市集', location: '大学城 · 青年文化广场', category: '活动', icon: '✦', tone: 'green', pay: 160, unit: '天', dates: [sunday], startTime: '09:00', endTime: '17:00', headcount: 3, tags: ['团队协作', '活动体验'], description: '协助摊位布置、签到引导和现场秩序维护。适合乐于协作、对活动组织感兴趣的同学。', settlement: '活动结束后结算（示例）' },
        { id: 'lime-light', title: '轻食店打包助手', merchant: '青柠轻食', location: '大学城 · 学生公寓附近', category: '餐饮', icon: '◒', tone: 'green', pay: 23, unit: '小时', dates: [saturday, sunday], startTime: '11:00', endTime: '15:00', headcount: 2, tags: ['短时班次', '午间兼职'], description: '协助餐品打包、核对订单和备品补充。午间班次，方便安排自己的周末计划。', settlement: '按实际工时结算（示例）' },
        { id: 'daily-lifestyle', title: '生活方式店理货员', merchant: '小日子生活馆', location: '大学城 · 步行街', category: '零售', icon: '▧', tone: '', pay: 21, unit: '小时', dates: [sunday], startTime: '13:00', endTime: '19:00', headcount: 1, tags: ['下午班', '细心优先'], description: '协助商品陈列、库存整理和顾客指引。适合有耐心、喜欢整洁陈列的同学。', settlement: '工作结束后结算（示例）' },
        { id: 'sports-day', title: '校园运动会引导员', merchant: '青年运动社', location: '大学城 · 体育中心', category: '活动', icon: '⚑', tone: 'orange', pay: 180, unit: '天', dates: [saturday], startTime: '08:00', endTime: '16:00', headcount: 4, tags: ['户外活动', '沟通协作'], description: '协助参赛签到、赛场引导和物资分发。活动期间需要按安排到岗并与团队保持沟通。', settlement: '活动结束后结算（示例）' }
      ],
      applications: []
    };
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DATA_KEY));
      if (parsed && parsed.version === 1 && Array.isArray(parsed.jobs) && Array.isArray(parsed.applications)) return parsed;
    } catch (_) {
      // A missing or malformed demo state starts from the built-in sample data.
    }
    return createSeedState();
  }

  let state = readState();
  let activeRole = 'student';
  let activeStudentName = localStorage.getItem(PROFILE_KEY) || '林同学';
  let selectedCategory = '全部';
  let selectedDay = 'all';
  let pendingJobId = null;
  let toastTimer = null;

  function saveState() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
    } catch (_) {
      showToast('浏览器未能保存演示数据，请检查本地存储设置。');
    }
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function nameKey(name) {
    return String(name || '').trim().normalize('NFKC').toLocaleLowerCase();
  }

  function dateObject(dateString) {
    return new Date(`${dateString}T12:00:00`);
  }

  function weekStart(date) {
    const start = new Date(date);
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return toISODate(start);
  }

  function weekendDateLabel(dateString) {
    const date = dateObject(dateString);
    const relativeWeek = weekStart(date) === weekStart(new Date()) ? '本周' : '下周';
    return `${relativeWeek}${dayNames[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
  }

  function scheduleText(job, separator = ' / ') {
    const dates = (job.dates || []).map(weekendDateLabel).join(separator);
    return `${dates} · ${job.startTime}–${job.endTime}`;
  }

  function applicationStatus(status) {
    return ({ pending: '待商家确认', hired: '已录用', rejected: '未录用' })[status] || '待商家确认';
  }

  function hiredCount(jobId) {
    return state.applications.filter(application => application.jobId === jobId && application.status === 'hired').length;
  }

  function isFull(job) {
    return hiredCount(job.id) >= Number(job.headcount);
  }

  function myApplication(jobId, studentName = activeStudentName) {
    const key = nameKey(studentName);
    return state.applications.find(application => application.jobId === jobId && application.studentKey === key);
  }

  function jobIcon(job) {
    const art = categoryArt[job.category] || categoryArt.活动;
    return { icon: job.icon || art.icon, tone: job.tone ?? art.tone };
  }

  function renderJobCard(job) {
    const full = isFull(job);
    const application = myApplication(job.id);
    const statusText = full ? '已招满' : application ? '已报名' : '招募中';
    const statusClass = full ? 'job-status full' : 'job-status';
    const applyLabel = full ? '已招满' : application ? '已报名' : '立即报名';
    const art = jobIcon(job);
    const tags = [...(job.tags || []), 'Demo 示例'].map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
    return `<article class="job-card" data-job-id="${escapeHTML(job.id)}">
      <div class="job-top">
        <div class="job-icon ${escapeHTML(art.tone)}" aria-hidden="true">${escapeHTML(art.icon)}</div>
        <div class="job-shop"><div class="merchant-line">${escapeHTML(job.merchant)} <span class="demo-chip">DEMO</span></div><div class="location">${escapeHTML(job.location)}</div></div>
        <span class="${statusClass}">${statusText}</span>
      </div>
      <h3>${escapeHTML(job.title)}</h3>
      <div class="tags">${tags}</div>
      <div class="job-facts">
        <span><b aria-hidden="true">◷</b>${escapeHTML(scheduleText(job))}</span>
        <span><b aria-hidden="true">♧</b>招 ${escapeHTML(job.headcount)} 人</span>
      </div>
      <div class="job-bottom">
        <span class="pay">¥${escapeHTML(job.pay)}<small>/ ${escapeHTML(job.unit)}</small></span>
        <div class="card-actions">
          <button class="detail-button" type="button" data-detail-job="${escapeHTML(job.id)}" aria-label="查看${escapeHTML(job.title)}详情">详情</button>
          <button class="apply-button" type="button" data-apply-job="${escapeHTML(job.id)}" ${full || application ? 'disabled' : ''}>${applyLabel}</button>
        </div>
      </div>
    </article>`;
  }

  function jobMatches(job, keyword) {
    const searchable = `${job.title} ${job.merchant} ${job.location} ${job.description}`.toLocaleLowerCase();
    const matchesCategory = selectedCategory === '全部' || job.category === selectedCategory;
    const matchesKeyword = searchable.includes(keyword);
    const matchesDay = selectedDay === 'all' || (job.dates || []).some(date => {
      const day = dateObject(date).getDay();
      return selectedDay === 'saturday' ? day === 6 : day === 0;
    });
    const payFilter = elements.payFilter.value;
    const matchesPay = payFilter === 'all'
      || (payFilter === 'hourly-20' && job.unit === '小时' && Number(job.pay) >= 20)
      || (payFilter === 'daily-150' && job.unit === '天' && Number(job.pay) >= 150);
    return matchesCategory && matchesKeyword && matchesDay && matchesPay;
  }

  function renderJobs() {
    const keyword = elements.search.value.trim().toLocaleLowerCase();
    const jobs = state.jobs.filter(job => jobMatches(job, keyword));
    elements.jobGrid.innerHTML = jobs.map(renderJobCard).join('');
    elements.resultCount.textContent = `${jobs.length} 个周末机会 · Demo 示例数据`;
    elements.empty.hidden = jobs.length > 0;
  }

  function renderStudentApplications() {
    const applications = state.applications
      .filter(application => application.studentKey === nameKey(activeStudentName))
      .sort((a, b) => b.createdAt - a.createdAt);
    if (!applications.length) {
      elements.studentApplications.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">✓</span><h3>还没有报名记录</h3><p>挑一个适合的周末班次，报名后就能在这里查看进度。</p><button class="secondary-button" type="button" data-show-jobs>去找兼职</button></div>';
      return;
    }
    elements.studentApplications.innerHTML = applications.map(application => {
      const job = state.jobs.find(item => item.id === application.jobId);
      if (!job) return '';
      const statusClass = application.status === 'pending' ? '' : ` ${application.status}`;
      return `<article class="student-application">
        <div><h4>${escapeHTML(job.title)} <span class="demo-chip">DEMO</span></h4>
          <p>${escapeHTML(job.merchant)} · ${escapeHTML(job.location)}</p>
          <p>可工作：${escapeHTML(weekendDateLabel(application.availabilityDate))} · ${escapeHTML(job.startTime)}–${escapeHTML(job.endTime)}</p>
        </div>
        <span class="application-status${statusClass}">${applicationStatus(application.status)}</span>
      </article>`;
    }).join('');
  }

  function renderMerchantJobs() {
    elements.merchantEmpty.hidden = state.jobs.length > 0;
    elements.merchantJobs.innerHTML = state.jobs.map(job => {
      const applications = state.applications
        .filter(application => application.jobId === job.id)
        .sort((a, b) => a.createdAt - b.createdAt);
      const full = isFull(job);
      const hired = hiredCount(job.id);
      const cardStatus = full ? '<span class="job-status full">已招满</span>' : '<span class="job-status">招募中</span>';
      const rows = applications.length ? applications.map(application => {
        const pending = application.status === 'pending';
        const disabled = !pending || full;
        const statusClass = application.status === 'pending' ? '' : ` ${application.status}`;
        const blockedText = pending && full ? '<span class="seat-hint">名额已满</span>' : '';
        return `<div class="application-row" data-application-id="${escapeHTML(application.id)}">
          <div><div class="applicant-name">${escapeHTML(application.studentName)}</div><div class="applicant-detail">可工作：${escapeHTML(weekendDateLabel(application.availabilityDate))} · 报名于 ${escapeHTML(new Date(application.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</div></div>
          <span class="application-status${statusClass}">${applicationStatus(application.status)}</span>
          <div class="review-actions">${blockedText}<button class="hire-button" type="button" data-review="hired" data-application-id="${escapeHTML(application.id)}" ${disabled ? 'disabled' : ''}>录用</button><button type="button" data-review="rejected" data-application-id="${escapeHTML(application.id)}" ${pending ? '' : 'disabled'}>不录用</button></div>
        </div>`;
      }).join('') : '<div class="applicant-empty">还没有学生报名。岗位开放后，报名记录会显示在这里。</div>';
      return `<article class="merchant-job-card" data-job-id="${escapeHTML(job.id)}">
        <div class="merchant-job-head"><div><h3>${escapeHTML(job.title)} <span class="demo-chip">DEMO</span></h3><p>${escapeHTML(job.merchant)} · ${escapeHTML(job.location)}</p></div>${cardStatus}</div>
        <div class="merchant-job-meta"><span>时间：<strong>${escapeHTML(scheduleText(job))}</strong></span><span>薪资：<strong>¥${escapeHTML(job.pay)} / ${escapeHTML(job.unit)}</strong></span><span>录用名额：<strong>${hired}/${escapeHTML(job.headcount)}</strong></span></div>
        <div class="applicant-heading"><span>学生报名 · ${applications.length} 人</span><span>${full ? '录用名额已满' : `还可录用 ${Number(job.headcount) - hired} 人`}</span></div>
        <div class="applicants">${rows}</div>
      </article>`;
    }).join('');
  }

  function render() {
    elements.currentStudent.textContent = activeStudentName;
    renderJobs();
    renderStudentApplications();
    renderMerchantJobs();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3200);
  }

  function setRole(role) {
    activeRole = role;
    const isStudent = role === 'student';
    elements.studentPanel.hidden = !isStudent;
    elements.merchantPanel.hidden = isStudent;
    elements.roleStudent.classList.toggle('active', isStudent);
    elements.roleStudent.setAttribute('aria-pressed', String(isStudent));
    elements.roleMerchant.classList.toggle('active', !isStudent);
    elements.roleMerchant.setAttribute('aria-pressed', String(!isStudent));
    if (!isStudent) renderMerchantJobs();
    document.querySelector('#jobs').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setStudentView(view) {
    const showJobs = view === 'jobs';
    elements.jobsPane.hidden = !showJobs;
    elements.applicationsPane.hidden = showJobs;
    document.querySelectorAll('[data-student-view]').forEach(button => {
      const selected = button.dataset.studentView === view;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    if (!showJobs) renderStudentApplications();
  }

  function getJob(jobId) {
    return state.jobs.find(job => job.id === jobId);
  }

  function openDetails(jobId) {
    const job = getJob(jobId);
    if (!job) return;
    const art = jobIcon(job);
    const full = isFull(job);
    const tags = (job.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
    elements.detailContent.innerHTML = `<h2 id="detail-title">${escapeHTML(job.title)}</h2>
      <p class="detail-merchant"><span class="job-icon ${escapeHTML(art.tone)}" aria-hidden="true">${escapeHTML(art.icon)}</span> ${escapeHTML(job.merchant)} · ${escapeHTML(job.location)} <span class="demo-chip">DEMO</span></p>
      <div class="detail-pay pay">¥${escapeHTML(job.pay)}<small>/ ${escapeHTML(job.unit)}</small></div>
      <p class="detail-description">${escapeHTML(job.description)}</p>
      <dl><dt>工作日期</dt><dd>${escapeHTML((job.dates || []).map(weekendDateLabel).join('、'))}</dd>
        <dt>工作时间</dt><dd>${escapeHTML(job.startTime)}–${escapeHTML(job.endTime)}</dd>
        <dt>工作地点</dt><dd>${escapeHTML(job.location)}</dd>
        <dt>招募人数</dt><dd>${escapeHTML(job.headcount)} 人${full ? ' · 已招满' : ''}</dd>
        <dt>结算方式</dt><dd>${escapeHTML(job.settlement)}</dd>
        <dt>岗位要求</dt><dd>${tags || '按商家现场安排完成周末班次。'}</dd>
        <dt>注意事项</dt><dd>本岗位为 Demo 虚构示例；实际工作请先核实商家与用工安排。</dd></dl>`;
    const application = myApplication(job.id);
    elements.applyFromDetail.dataset.jobId = job.id;
    elements.applyFromDetail.disabled = full || Boolean(application);
    elements.applyFromDetail.textContent = full ? '已招满' : application ? '你已报名' : '立即报名 ↗';
    elements.details.showModal();
  }

  function openApplication(jobId) {
    const job = getJob(jobId);
    if (!job) return;
    if (isFull(job)) {
      showToast('这个岗位的录用名额已满。');
      renderJobs();
      return;
    }
    if (myApplication(job.id)) {
      showToast('这个演示昵称已经报名，可在「我的报名」查看状态。');
      return;
    }
    pendingJobId = job.id;
    elements.applicationSummary.textContent = `${job.title} · ${job.merchant}｜${scheduleText(job)}｜¥${job.pay}/${job.unit}`;
    elements.studentName.value = activeStudentName;
    elements.availability.innerHTML = (job.dates || []).map(date => `<option value="${escapeHTML(date)}">${escapeHTML(weekendDateLabel(date))} · ${escapeHTML(job.startTime)}–${escapeHTML(job.endTime)}</option>`).join('');
    elements.applicationDialog.showModal();
    elements.studentName.focus();
  }

  function submitApplication(event) {
    event.preventDefault();
    const job = getJob(pendingJobId);
    const studentName = elements.studentName.value.trim();
    const availabilityDate = elements.availability.value;
    if (!job || !studentName || !availabilityDate) return;
    if (isFull(job)) {
      elements.applicationDialog.close();
      showToast('录用名额刚刚已满，请选择其他班次。');
      render();
      return;
    }
    const studentKey = nameKey(studentName);
    if (state.applications.some(application => application.jobId === job.id && application.studentKey === studentKey)) {
      elements.applicationDialog.close();
      showToast('同一个演示昵称不能重复报名。');
      render();
      return;
    }
    state.applications.push({
      id: `application-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      jobId: job.id,
      studentKey,
      studentName,
      availabilityDate,
      createdAt: Date.now(),
      status: 'pending'
    });
    activeStudentName = studentName;
    localStorage.setItem(PROFILE_KEY, activeStudentName);
    saveState();
    elements.applicationDialog.close();
    render();
    showToast('报名成功，等待商家确认。可在「我的报名」查看进度。');
  }

  function reviewApplication(applicationId, nextStatus) {
    const application = state.applications.find(item => item.id === applicationId);
    if (!application || application.status !== 'pending') return;
    if (nextStatus === 'hired') {
      const job = getJob(application.jobId);
      if (!job || isFull(job)) {
        renderMerchantJobs();
        showToast('录用名额已满，无法超额录用。');
        return;
      }
    }
    application.status = nextStatus;
    application.reviewedAt = Date.now();
    saveState();
    render();
    showToast(nextStatus === 'hired' ? '已录用，这位同学会在「我的报名」看到结果。' : '已更新为未录用。');
  }

  function nearestSaturday() {
    return upcomingWeekend().saturday;
  }

  function openPostDialog() {
    const dateInput = document.querySelector('#post-date');
    dateInput.min = toISODate(new Date());
    dateInput.value = nearestSaturday();
    elements.postDialog.showModal();
    document.querySelector('#post-merchant').focus();
  }

  function submitJob(event) {
    event.preventDefault();
    const date = document.querySelector('#post-date').value;
    const startTime = document.querySelector('#post-start').value;
    const endTime = document.querySelector('#post-end').value;
    if (startTime >= endTime) {
      showToast('结束时间需要晚于开始时间。');
      document.querySelector('#post-end').focus();
      return;
    }
    const category = document.querySelector('#post-category').value;
    const art = categoryArt[category] || categoryArt.活动;
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: document.querySelector('#post-title').value.trim(),
      merchant: document.querySelector('#post-merchant').value.trim(),
      location: document.querySelector('#post-location').value.trim(),
      category,
      icon: art.icon,
      tone: art.tone,
      pay: Number(document.querySelector('#post-pay').value),
      unit: document.querySelector('#post-unit').value,
      dates: [date],
      startTime,
      endTime,
      headcount: Number(document.querySelector('#post-headcount').value),
      tags: ['周末班次', 'Demo 岗位'],
      description: document.querySelector('#post-description').value.trim(),
      settlement: document.querySelector('#post-settlement').value.trim()
    };
    if (!job.title || !job.merchant || !job.location || !job.description || !job.settlement || !date || job.pay <= 0 || job.headcount < 1) return;
    state.jobs.unshift(job);
    saveState();
    elements.postDialog.close();
    elements.postForm.reset();
    document.querySelector('#post-start').value = '09:00';
    document.querySelector('#post-end').value = '17:00';
    document.querySelector('#post-headcount').value = '2';
    document.querySelector('#post-date').value = nearestSaturday();
    render();
    showToast('岗位已发布到学生端，信息保存在当前浏览器。');
  }

  function resetDemo() {
    state = createSeedState();
    activeStudentName = '林同学';
    selectedCategory = '全部';
    selectedDay = 'all';
    elements.search.value = '';
    elements.payFilter.value = 'all';
    document.querySelectorAll('[data-filter]').forEach(button => {
      const active = button.dataset.filter === '全部';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-day-filter]').forEach(button => {
      const active = button.dataset.dayFilter === 'all';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    localStorage.removeItem(DATA_KEY);
    localStorage.setItem(PROFILE_KEY, activeStudentName);
    setRole('student');
    setStudentView('jobs');
    saveState();
    render();
    showToast('演示数据已重置，已恢复 6 个初始岗位。');
  }

  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderJobs();
  }));

  document.querySelectorAll('[data-day-filter]').forEach(button => button.addEventListener('click', () => {
    selectedDay = button.dataset.dayFilter;
    document.querySelectorAll('[data-day-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderJobs();
  }));

  elements.search.addEventListener('input', renderJobs);
  elements.payFilter.addEventListener('change', renderJobs);
  document.querySelector('#clear-filters').addEventListener('click', () => {
    selectedCategory = '全部';
    selectedDay = 'all';
    elements.search.value = '';
    elements.payFilter.value = 'all';
    document.querySelectorAll('[data-filter], [data-day-filter]').forEach(button => {
      const active = button.dataset.filter === '全部' || button.dataset.dayFilter === 'all';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderJobs();
  });

  elements.jobGrid.addEventListener('click', event => {
    const detailButton = event.target.closest('[data-detail-job]');
    if (detailButton) openDetails(detailButton.dataset.detailJob);
    const applyButton = event.target.closest('[data-apply-job]');
    if (applyButton && !applyButton.disabled) openApplication(applyButton.dataset.applyJob);
  });
  elements.applyFromDetail.addEventListener('click', () => {
    const jobId = elements.applyFromDetail.dataset.jobId;
    elements.details.close();
    openApplication(jobId);
  });

  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => {
    button.closest('dialog').close();
  }));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));

  elements.applyForm.addEventListener('submit', submitApplication);
  document.querySelector('#switch-student').addEventListener('click', () => {
    elements.profileName.value = activeStudentName;
    elements.profileDialog.showModal();
    elements.profileName.focus();
  });
  elements.profileForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = elements.profileName.value.trim();
    if (!name) return;
    activeStudentName = name;
    localStorage.setItem(PROFILE_KEY, activeStudentName);
    elements.profileDialog.close();
    render();
    showToast(`已切换到 ${activeStudentName} 的演示报名记录。`);
  });

  elements.merchantJobs.addEventListener('click', event => {
    const button = event.target.closest('[data-review]');
    if (button && !button.disabled) reviewApplication(button.dataset.applicationId, button.dataset.review);
  });
  document.querySelector('#post-job-open').addEventListener('click', openPostDialog);
  document.querySelector('[data-open-post-job]').addEventListener('click', openPostDialog);
  elements.postForm.addEventListener('submit', submitJob);

  elements.roleStudent.addEventListener('click', () => setRole('student'));
  elements.roleMerchant.addEventListener('click', () => setRole('merchant'));
  document.querySelectorAll('[data-student-view]').forEach(button => button.addEventListener('click', () => setStudentView(button.dataset.studentView)));
  elements.studentApplications.addEventListener('click', event => {
    if (event.target.closest('[data-show-jobs]')) setStudentView('jobs');
  });
  document.querySelector('#reset-demo').addEventListener('click', resetDemo);

  window.addEventListener('storage', event => {
    if (event.key !== DATA_KEY && event.key !== null) return;
    state = readState();
    render();
  });

  render();
})();
