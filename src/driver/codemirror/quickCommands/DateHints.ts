import { Hint } from "./quickCommands";
import dayjs from 'dayjs';

const DateHints: Hint[] = [
  {
    text: dayjs().format(dayjs().format("MM/DD/YYYY")),
    displayText: '/today',
    description: 'Today',
    inline: true
  },
  {
    text: dayjs().format(dayjs().format("MM/DD/YYYY HH:mm:ss")),
    displayText: '/now',
    description: 'now',
    inline: true
  },
  {
    text: dayjs().add(1, 'day').format(dayjs().format('MM/DD/YYYY')),
    displayText: '/tomorrow',
    description: 'Tomorrow',
    inline: true
  }
];

export default DateHints;

