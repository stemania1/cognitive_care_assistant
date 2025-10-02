import { Question } from '@/types/daily-questions';

export const ALL_QUESTIONS: Question[] = [
  { id: "favoriteColor", text: "What is your favorite color?" },
  { id: "favoriteMeal", text: "What's your favorite meal of the day — breakfast, lunch, or dinner?", choices: ["Breakfast", "Lunch", "Dinner"] },
  { id: "catsDogs", text: "Do you like cats, dogs, or both?", choices: ["Cats", "Dogs", "Both"] },
  { id: "favoriteSeat", text: "What's your favorite place to sit at home?" },
  { id: "favoriteAsChild", text: "What was your favorite thing to do when you were younger?" },
  { id: "firstJob", text: "What was your first job or something you enjoyed doing?" },
  { id: "drinkPref", text: "What do you like to drink — tea, coffee, or something else?", choices: ["Tea", "Coffee", "Something else"] },
  { id: "smile", text: "What makes you smile?" },
  { id: "weather", text: "What kind of weather do you enjoy?" },
  { id: "calm", text: "What helps you feel calm?" },
  { id: "children", text: "Do you have any children?" },
  { id: "grandchildren", text: "Do you have any grandchildren?" },
  { id: "parentsNames", text: "What were your parents' names?" },
  { id: "siblings", text: "Do you have any brothers or sisters?" },
  { id: "fullName", text: "What is your full name?" },
  { id: "birthday", text: "When is your birthday (or do you remember what time of year it is)?" },
  { id: "married", text: "Were you married?" },
  { id: "born", text: "Where were you born or where did you grow up?" },
];
