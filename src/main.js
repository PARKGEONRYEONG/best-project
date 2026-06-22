import { createClient } from '@supabase/supabase-js';
import flatpickr from "flatpickr";
import Sortable from 'sortablejs'; 
import "flatpickr/dist/flatpickr.min.css";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const goalForm = document.getElementById('goalForm');
const goalInput = document.getElementById('goalInput');
const timeInput = document.getElementById('timeInput'); 
const categorySelect = document.getElementById('categorySelect');
const goalsContainer = document.getElementById('goalsContainer');
const quoteElement = document.getElementById('quote');

let allGoals = [];

async function fetchQuote() {
  if (!quoteElement) return;
  const quotes = [
    { text: "시작이 반이다.", author: "아리스토텔레스" },
    { text: "피할 수 없으면 즐겨라.", author: "로버트 엘리엇" },
    { text: "고통 없는 승리는 영광이 없다.", author: "나폴레옹" },
    { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤자민 프랭클린" },
    { text: "꿈을 기록하면 꿈이 현실이 된다.", author: "작자 미상" },
    { text: "성공은 매일 반복한 작은 노력들의 합이다.", author: "로버트 콜리어" },
    { text: "자신을 믿어라.", author: "괴테" },
    { text: "지금 이 순간에 충실하라.", author: "마르쿠스 아우렐리우스" },
    { text: "열정 없이는 아무것도 이루어지지 않는다.", author: "랄프 왈도 에머슨" },
    { text: "작은 일에 정성을 다하라.", author: "중용" },
    { text: "가장 큰 위험은 아무 위험도 감수하지 않는 것이다.", author: "마크 저커버그" },
    { text: "어제와 똑같이 살면서 다른 미래를 기대할 순 없다.", author: "아인슈타인" },
    { text: "불가능은 노력하지 않는 자의 핑계다.", author: "나폴레옹" },
    { text: "시련은 있어도 실패는 없다.", author: "정주영" },
    { text: "천 리 길도 한 걸음부터.", author: "노자" },
    { text: "행복은 습관이다.", author: "엘버트 허버드" },
    { text: "도전은 삶을 흥미롭게 만든다.", author: "조슈아 마린" },
    { text: "최고에 도달하려면 최저에서 시작하라.", author: "시루스" },
    { text: "내일은 내일의 해가 뜬다.", author: "마거릿 미첼" },
    { text: "진정한 발견은 새로운 땅을 찾는 것이 아니다.", author: "마르셀 프루스트" },
    { text: "준비된 자에게 기회는 온다.", author: "루이 파스퇴르" },
    { text: "인생은 속도가 아니라 방향이다.", author: "이솝" },
    { text: "실패는 성공의 어머니이다.", author: "명언" },
    { text: "나 자신을 아는 것이 모든 지혜의 시작이다.", author: "아리스토텔레스" },
    { text: "기회는 준비된 사람에게만 찾아온다.", author: "루이 파스퇴르" },
    { text: "오늘의 나를 만든 것은 어제의 나다.", author: "윈스턴 처칠" },
    { text: "끈기 있는 사람이 결국 이긴다.", author: "조지 알렌" },
    { text: "생각하는 대로 살지 않으면 사는 대로 생각하게 된다.", author: "폴 발레리" },
    { text: "결코 포기하지 마라.", author: "윈스턴 처칠" },
    { text: "빛이 있는 곳엔 반드시 그림자가 있다.", author: "작자 미상" }
  ];
  const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
  quoteElement.innerHTML = `"${selectedQuote.text}"<br><small>- ${selectedQuote.author} -</small>`;
}

flatpickr("#datePicker", { dateFormat: "Y-m-d", defaultDate: new Date(), onChange: (_, dateStr) => fetchGoalsByDate(dateStr) });

async function fetchGoalsByDate(date) {
  const { data } = await supabase.from('goals').select('*').eq('created_at', date).order('order_index', { ascending: true });
  allGoals = data || [];
  renderGoals();
}

function renderGoals() {
  goalsContainer.innerHTML = allGoals.length === 0 ? '<div style="text-align:center; padding:20px; color:#888;">일정이 없습니다.</div>' : '';
  allGoals.forEach(goal => goalsContainer.appendChild(createGoalElement(goal)));
  
  new Sortable(goalsContainer, {
    animation: 150,
    onEnd: async (evt) => {
      const movedItem = allGoals.splice(evt.oldIndex, 1)[0];
      allGoals.splice(evt.newIndex, 0, movedItem);
      for (let i = 0; i < allGoals.length; i++) {
        await supabase.from('goals').update({ order_index: i }).eq('id', allGoals[i].id);
      }
    }
  });
}

function createGoalElement(goal) {
  const div = document.createElement('div');
  div.className = `goal-item ${goal.is_active ? '' : 'completed'}`;
  div.innerHTML = `<div class="goal-content"><span class="goal-category">${goal.category} | ${goal.time || '미지정'}</span><span class="goal-title">${goal.title}</span></div><div class="action-box"><span class="goal-status">${goal.is_active ? '진행 중' : '✓ 완료'}</span><button class="delete-btn">🗑️</button></div>`;
  div.addEventListener('click', (e) => { if (!e.target.classList.contains('delete-btn')) toggleGoalStatus(goal); });
  div.querySelector('.delete-btn').addEventListener('click', (e) => deleteGoal(e, goal.id));
  return div;
}

async function toggleGoalStatus(goal) {
  const { error } = await supabase.from('goals').update({ is_active: !goal.is_active }).eq('id', goal.id);
  if (!error) {
    allGoals = allGoals.map(g => g.id === goal.id ? { ...g, is_active: !g.is_active } : g);
    renderGoals();
  }
}

async function deleteGoal(e, goalId) {
  e.stopPropagation();
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (!error) {
    allGoals = allGoals.filter(g => g.id !== goalId);
    renderGoals();
  }
}

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const date = document.getElementById('datePicker').value;
  const { data, error } = await supabase.from('goals').insert([{ title: goalInput.value, category: categorySelect.value, time: timeInput.value, is_active: true, created_at: date, order_index: allGoals.length }]).select();
  if (!error) { allGoals.push(data[0]); goalInput.value = ''; renderGoals(); }
});

document.addEventListener('DOMContentLoaded', () => { fetchQuote(); fetchGoalsByDate(new Date().toISOString().split('T')[0]); });