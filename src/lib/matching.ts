import type { University, UniversityMatch, UniversityCategory } from '@/types';
import { universities } from '@/data/universities';

interface MatchInput {
  gpa: number;
  ieltsScore: number;
  specialty: string;
  desiredCountries: string[];
  financialSituation: string;
}

const financialCap: Record<string, number> = {
  low: 10000,
  medium: 30000,
  high: 100000,
};

export function matchUniversities(input: MatchInput): UniversityMatch[] {
  const cap = financialCap[input.financialSituation] ?? 100000;

  const scored = universities
    .filter((u) => input.desiredCountries.length === 0 || input.desiredCountries.includes(u.country))
    .map((u) => {
      let score = 0;

      const gpaRatio = Math.min(input.gpa / u.minGpa, 1);
      score += gpaRatio * 40;

      const ieltsRatio = Math.min(input.ieltsScore / u.minIelts, 1);
      score += ieltsRatio * 30;

      const specialtyMatch = u.specialtiesRu.some(
        (s) => s.toLowerCase().includes(input.specialty.toLowerCase()) ||
        input.specialty.toLowerCase().includes(s.toLowerCase())
      );
      score += specialtyMatch ? 15 : 0;

      const financialFit = u.tuitionUsd <= cap ? 15 : Math.max(0, 15 - ((u.tuitionUsd - cap) / 5000));
      score += financialFit;

      const matchScore = Math.round(Math.min(score, 100));

      let category: UniversityCategory;
      if (matchScore >= 75) category = 'Safety';
      else if (matchScore >= 55) category = 'Target';
      else category = 'Reach';

      return { ...u, matchScore, category };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, 12);
}

export function generateChecklist(input: MatchInput): Array<{
  title: string;
  description: string;
  deadline: string;
  category: string;
}> {
  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const items: Array<{ title: string; description: string; deadline: string; category: string }> = [
    {
      title: 'Подготовить и перевести аттестат и табель',
      description: 'Соберите школьный аттестат и официальные табели оценок. Заверьте их нотариально и переведите на английский язык.',
      deadline: addDays(45),
      category: 'Documents',
    },
    {
      title: 'Написать мотивационное письмо',
      description: 'Составьте убедительное мотивационное письмо, адаптированное под выбранную специальность и целевые университеты.',
      deadline: addDays(30),
      category: 'Documents',
    },
    {
      title: `Записаться на экзамен IELTS (текущий: ${input.ieltsScore})`,
      description: 'Зарегистрируйтесь на тест IELTS. Большинство университетов требуют минимум 6.5 баллов.',
      deadline: addDays(21),
      category: 'Tests',
    },
    {
      title: 'Запросить 2-3 рекомендательных письма',
      description: 'Попросите преподавателей или работодателей, которые хорошо вас знают, написать рекомендательные письма.',
      deadline: addDays(35),
      category: 'Documents',
    },
    {
      title: 'Подготовить паспорт (срок 18+ мес)',
      description: 'Убедитесь, что ваш загранпаспорт действует минимум 18 месяцев после планируемой даты начала обучения.',
      deadline: addDays(14),
      category: 'Documents',
    },
    {
      title: 'Подать заявки в 3-5 университетов',
      description: 'Отправьте заявки в подобранные университеты категорий «Запас», «Цель» и «Мечта».',
      deadline: addDays(60),
      category: 'Applications',
    },
    {
      title: 'Подготовить финансовые документы',
      description: 'Соберите справки о доходах, спонсорские письма и банковские выписки, необходимые для визы.',
      deadline: addDays(50),
      category: 'Finance',
    },
    {
      title: 'Подать заявки на гранты и стипендии',
      description: 'Найдите и подайте заявки на релевантные стипендии: государственные гранты, университетские программы и фонды.',
      deadline: addDays(40),
      category: 'Finance',
    },
    {
      title: 'Оформить студенческую визу',
      description: 'После зачисления подайте документы на студенческую визу в посольстве страны обучения.',
      deadline: addDays(75),
      category: 'Applications',
    },
  ];

  return items;
}
