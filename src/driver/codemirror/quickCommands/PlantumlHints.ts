import { Hint } from "./quickCommands";

const sequanceDiagramText = () => {
  return '```plantuml\n' +
    '@startuml diagramName\n' +
    'participant fullName as name\n' +
    'participant another\n\n\n' +

    'group group_name\n' +
    '    name -> another: some description\n' +
    '    another -> name: some description \n' +
    'end\n' +
    '@enduml\n' +
    '```'
};


const classDiagramText = () => {
    return '```plantuml\n' +
    '@startuml\n' +
    'interface Store {\n' +
    '    List<Product> getProducts\n' +
    '}\n' +
    'Store *-- Product\n\n' +

    'class LintaoStore implements Store\n' +
    'interface Product\n' +
    'class Computer implements Product\n' +
    'class Phone implements Product\n' +
    '@enduml\n' +
    '```'
}

const PlantumlHints: Hint[] = [
  {
    text: sequanceDiagramText(),
    displayText: "/psequenceDiagram",
    description: 'Sequence diagram | plantuml',
    inline: false
  },
  {
    text: classDiagramText(),
    displayText: "/pclassDiagramText",
    description: 'Class diagram | plantuml',
    inline: false
  }
];

export default PlantumlHints;

