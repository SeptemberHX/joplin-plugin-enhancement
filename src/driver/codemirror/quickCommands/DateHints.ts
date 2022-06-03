import { Hint } from "./quickCommands";
import dayjs from 'dayjs';

const DateHints: Hint[] = [
  {
    text: dayjs().format(dayjs().format("MM/DD/YYYY")),
    displayText: '/today',
    description: 'Today',
  },
  {
    text: dayjs().format(dayjs().format("MM/DD/YYYY HH:mm:ss")),
    displayText: '/now',
    description: 'now',
  }
];

export default DateHints;

