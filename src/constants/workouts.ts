import { WorkoutExercise } from '@/types/emg';

export const WORKOUT_ROUTINES: WorkoutExercise[] = [
  {
    id: 'chair_arm_swings',
    name: 'Chair & Arm Swings',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Builds rhythm and coordination with seated marching and arm movements',
    instructions: [
      'Sit tall with good posture',
      'March in place while seated',
      'Swing arms naturally with marching',
      'Add gentle arm circles forward',
      'Switch to backward arm circles',
      'Keep rhythm steady and comfortable'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm swing intensity and rhythm consistency',
    sensorPlacement: 'Place on upper arm (bicep) to monitor arm movement patterns',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'balance_posture',
    name: 'Balance & Posture (With Support)',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Standing exercises using a chair for support and balance',
    instructions: [
      'Stand behind chair, holding back for support',
      'Rise up onto toes, hold for 3 seconds',
      'Lower heels slowly to ground',
      'Lift toes up, hold for 3 seconds',
      'Step to the side, return to center',
      'Repeat sequence 3-5 times'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg and balance movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'finger_wrist_hand',
    name: 'Finger, Wrist & Hand Movements',
    duration: 180, // 3 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Fine motor skill workout for dexterity and coordination',
    instructions: [
      'Sit with arms resting on thighs',
      'Tap each finger to thumb individually',
      'Roll wrists in circular motions',
      'Squeeze imaginary soft ball',
      'Open and close hands slowly',
      'Repeat each movement 10 times'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor forearm muscle activation during finger and wrist movements',
    sensorPlacement: 'Place on forearm to track fine motor muscle activity',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  },
  {
    id: 'leg_foot_movement',
    name: 'Leg & Foot Movement',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Improves circulation with seated leg and foot exercises',
    instructions: [
      'Sit with feet flat on floor',
      'Tap toes up and down alternately',
      'Extend one leg at a time, hold 3 seconds',
      'Make ankle circles clockwise and counterclockwise',
      'Seated kicks - lift knee up gently',
      'Repeat each movement 10 times per leg'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises'
  },
  {
    id: 'yoga_flow',
    name: 'Yoga Flow',
    duration: 360, // 6 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Gentle, flowing seated poses for flexibility and relaxation',
    instructions: [
      'Sit tall with spine straight',
      'Reach right arm up and over to left side',
      'Hold stretch for 3 breaths',
      'Return to center, repeat on left side',
      'Interlace fingers, reach arms overhead',
      'Gently twist spine left and right'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm muscle engagement during stretches and poses',
    sensorPlacement: 'Place on upper arm (bicep) to monitor stretch intensity'
  },
  {
    id: 'dance_clap_music',
    name: 'Dance and Clap to Music',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Pick a familiar, happy song and move to the rhythm',
    instructions: [
      'Choose a favorite upbeat song',
      'Clap hands to the beat',
      'Sway arms side to side',
      'Tap feet to the rhythm',
      'Add gentle head movements',
      'Enjoy the joyful movement!'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm movement intensity and rhythm consistency',
    sensorPlacement: 'Place on upper arm (bicep) to track dance movements'
  },
  {
    id: 'hoop_ball_play',
    name: 'Hoop & Ball Play',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Seated balloon toss or light ball catch for coordination',
    instructions: [
      'Sit with good posture',
      'Hold balloon or light ball',
      'Toss gently up and catch',
      'Pass ball from hand to hand',
      'Try gentle overhead passes',
      'Keep movements smooth and controlled'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track arm coordination and ball handling movements',
    sensorPlacement: 'Place on upper arm (bicep) to monitor ball play movements'
  },
  {
    id: 'lifting_weights',
    name: 'Lifting Weights',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Light arm exercises using water bottles or soup cans',
    instructions: [
      'Hold water bottles or soup cans',
      'Curl arms up to shoulders slowly',
      'Lower weights with control',
      'Raise arms out to sides',
      'Press weights overhead gently',
      'Repeat each movement 8-10 times'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Perfect for monitoring muscle activation during weight lifting',
    sensorPlacement: 'Place on upper arm (bicep) to track lifting intensity'
  },
  {
    id: 'visual_memory_game',
    name: 'Visual & Memory Movement Game',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Touch objects and match movements to memory cues',
    instructions: [
      'Name a color or object nearby',
      'Touch the object when named',
      'Match movements to cues',
      'Touch knees when hearing "apple"',
      'Touch head when hearing "hat"',
      'Keep movements fun and engaging'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm movement patterns during memory-based exercises',
    sensorPlacement: 'Place on upper arm (bicep) to track reaching movements'
  },
  {
    id: 'neck_gentle_stretch',
    name: 'Neck Gentle Stretch',
    duration: 180, // 3 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Easy movements to reduce tension in neck and shoulders',
    instructions: [
      'Sit with spine straight',
      'Gently tilt head to right, hold 3 breaths',
      'Return to center, tilt to left',
      'Roll shoulders backward slowly',
      'Gently twist neck left and right',
      'End with gentle head nods'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on neck and shoulder movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on neck and shoulder exercises'
  },
  {
    id: 'mini_tai_chi',
    name: 'Mini Tai Chi-Inspired Moves',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Slow, flowing movements inspired by Tai Chi',
    instructions: [
      'Sit or stand with feet shoulder-width apart',
      'Wave hands like clouds slowly',
      'Paint the sky with arm movements',
      'Scoop the air with cupped hands',
      'Move in slow, flowing motions',
      'Focus on smooth, continuous movement'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Track smooth, flowing arm movements and muscle control',
    sensorPlacement: 'Place on upper arm (bicep) to monitor Tai Chi movements'
  },
  {
    id: 'foot_strength_balance',
    name: 'Foot Strength & Balance',
    duration: 240, // 4 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Standing exercises near a counter for support',
    instructions: [
      'Stand near counter for support',
      'Walk heel-to-toe slowly',
      'Tap toes while holding counter',
      'Do mini squats with support',
      'Stand on one foot briefly',
      'Always use counter for safety'
    ],
    myoWareSuitable: false,
    myoWareReason: 'This workout focuses on leg and balance movements, not arm muscles',
    sensorPlacement: 'Not recommended - focus on leg exercises'
  },
  {
    id: 'mindful_breathing',
    name: 'Mindful Breathing & Movement',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'Sit quietly and move arms with breaths for relaxation',
    instructions: [
      'Sit quietly with eyes closed',
      'Move arms up with each inhale',
      'Lower arms with each exhale',
      'Relax hands and face muscles',
      'Focus on slow, deep breathing',
      'End with 3 deep inhales and exhales'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor gentle arm movements synchronized with breathing',
    sensorPlacement: 'Place on upper arm (bicep) to track breathing movements'
  },
  {
    id: 'seated_stretch_breathe',
    name: 'Seated Stretch & Breathe',
    duration: 300, // 5 minutes
    targetMuscles: ['leftBicep', 'rightBicep'],
    description: 'A calming routine with deep breaths, shoulder rolls, and gentle seated twists',
    instructions: [
      'Sit comfortably with feet flat on floor',
      'Take 3 deep breaths, inhaling through nose',
      'Roll shoulders backward 5 times',
      'Gently twist torso left, then right',
      'Reach arms overhead and stretch',
      'End with 3 more deep breaths'
    ],
    myoWareSuitable: true,
    myoWareReason: 'Monitor arm muscle activation during overhead reaches and shoulder rolls',
    sensorPlacement: 'Place on upper arm (bicep) to track arm movement intensity',
    videoUrl: undefined // Will use getVideoUrl() to get Supabase URL in production
  }
];

