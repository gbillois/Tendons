/**
 * exercises.js — Exercise definitions and day plan.
 */
const Exercises = (() => {

  const list = [
    {
      id: 'isometric',
      name: 'Isométrique',
      tag: 'iso',
      tagLabel: 'Antalgique',
      subtitle: 'Maintien sur pointe des pieds',
      description: 'Monte sur la pointe des pieds et <strong>tiens la position sans bouger</strong>. Tension modérée, pas de douleur vive.',
      reps: 5,
      holdSeconds: 45,
      restSeconds: 30,
      sets: 1,
      hasTimer: true,
      timerType: 'hold',  // hold = maintien statique
      variants: null,
      dosageText: '5 × 45s',
      frequencyText: '1-2x / jour'
    },
    {
      id: 'eccentric',
      name: 'Excentrique',
      tag: 'exc',
      tagLabel: 'Traitement',
      subtitle: 'Montée/descente sur les deux pieds',
      description: 'Monte et <strong>descends lentement</strong> sur la pointe des pieds, sur les <strong>deux pieds</strong>. Mouvement contrôlé.',
      reps: 15,
      descentSeconds: 5,
      restSeconds: 30,
      sets: 3,
      hasTimer: true,
      timerType: 'descent',
      variants: [
        { id: 'straight', label: 'Jambe tendue' },
        { id: 'bent', label: 'Genou fléchi' }
      ],
      dosageText: '3 × 15 reps',
      frequencyText: '1-2x / jour'
    },
    {
      id: 'mobility',
      name: 'Mobilité cheville',
      tag: 'mob',
      tagLabel: 'Complément',
      subtitle: 'Fente — genou au-dessus du pied',
      description: 'En fente, avance le <strong>genou au-dessus du pied</strong>. Le talon reste au sol. Mouvement lent et contrôlé.',
      reps: 10,
      sets: 2,
      restSeconds: 30,
      hasTimer: false,
      timerType: 'manual',  // user counts reps manually
      variants: null,
      dosageText: '2 × 10 reps',
      frequencyText: '1x / jour'
    }
  ];

  const dayPlan = [
    {
      day: 1,
      label: 'Jour 1',
      description: 'Isométrique + excentrique léger. Amplitude modérée.',
      exercises: ['isometric', 'eccentric'],
      maxSessions: 1
    },
    {
      day: 2,
      label: 'Jour 2',
      description: 'Idem jour 1. 1 séance, amplitude modérée.',
      exercises: ['isometric', 'eccentric'],
      maxSessions: 1
    },
    {
      day: 3,
      label: 'Jour 3',
      description: 'Passer à 2 séances/jour si OK. Amplitude augmentée.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    },
    {
      day: 4,
      label: 'Jour 4',
      description: '2 séances/jour. Amplitude augmentée.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    },
    {
      day: 5,
      label: 'Jour 5',
      description: 'Contrôle + amplitude max. Test marche si OK.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    }
  ];

  function getById(id) {
    return list.find(e => e.id === id);
  }

  function getDayPlan(dayNum) {
    return dayPlan.find(d => d.day === dayNum) || dayPlan[dayPlan.length - 1];
  }

  return { list, dayPlan, getById, getDayPlan };
})();
