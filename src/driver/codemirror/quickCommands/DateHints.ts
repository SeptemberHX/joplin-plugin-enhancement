import dayjs from 'dayjs';


export function getDateHints(dateFormat: string) {
  return [
    {
      text: dayjs().format(dateFormat),
      displayText: '/today',
      description: 'Today',
      inline: true
    },
    {
      text: dayjs().format(`${dateFormat} HH:mm:ss`),
      displayText: '/now',
      description: 'now',
      inline: true
    },
    {
      text: dayjs().add(1, 'day').format(dateFormat),
      displayText: '/tomorrow',
      description: 'Tomorrow',
      inline: true
    }
  ]
}
