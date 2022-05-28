import fetch from 'node-fetch';
import joplin from "../../../api";
import {DIDA365_COOKIE} from "../../common";

const DIDA_JOPLIN_PROJECT_NAME = 'Joplin';

/**
 * It contains many attributes, but we only care about the following ones.
 */
export class DidaProject {
    id: string;
    name: string;
}

export class DidaTask {
    id: string;
    projectId: string;
    title: string;
    status: number;
    items: DidaSubTask[];
    tags: Set<string>;

    setFinished(isFinished) {
        if (isFinished) {
            this.status = 2;
        } else {
            this.status = 0;
        }
    }

    contentEquals(o: DidaTask) {
        if (this.title === o.title && this.status === o.status) {
            if (this.items.length === o.items.length) {
                for (const item of this.items) {
                    let findEqual = false;
                    for (const oItem of o.items) {
                        if (oItem.contentEquals(item)) {
                            findEqual = true;
                            break;
                        }
                    }

                    if (!findEqual) {
                        return false;
                    }
                }

                if (this.tags.size === o.tags.size) {
                    for (const tag of this.tags) {
                        if (!o.tags.has(tag)) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}

export class DidaSubTask {
    id: string;
    title: string;
    status: number;
    startDate: Date;

    contentEquals(o) {
        return this.title === o.title && this.status === o.status && this.startDate === o.startDate;
    }
}

export class DidaReminder {

}


class Dida365Lib {
    cookie: string;
    joplinProjectId: string;
    checkPoint: number;

    constructor() {
        this.checkPoint = 0;
    }

    async init() {
        this.cookie = await joplin.settings.value(DIDA365_COOKIE);
        this.joplinProjectId = await this.getJoplinProjectId();
        console.log('Dida365Lib: joplin project id =', this.joplinProjectId);
    }

    headers() {
        return {
            cookie: this.cookie,
            'Content-Type': 'application/json;charset=UTF-8',
            'x-device': '{"platform":"web","device":"Chrome 102.0.5005.49","name":"","version":4216,","channel":"website","campaign":""}'
        }
    }

    async pushRegister(token: string) {
        const requestUrl = `https://api.dida365.com/api/v2/push/register`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify({
                'pushToken': token,
                'osType': 41
            })
        });
        if (response.ok) {
            const resJson = await response.json();
            console.log('Dida365Lib: push register successfully');
        } else {
            console.error('Dida365Lib: push register failed')
        }
    }

    async createJoplinProject() {
        const requestUrl = `https://api.dida365.com/api/v2/project`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify({
                "name": DIDA_JOPLIN_PROJECT_NAME,
                "color": "#3876E4",
                "groupId": null,
                "sortOrder": -8070452868710138000,
                "inAll": true,
                "muted": false,
                "teamId": null,
                "kind": "TASK",
                "isOwner": true
            })
        });
        if (response.ok) {
            const resJson = await response.json();
            console.log(resJson);
            return resJson.id;
        }

        return null;
    }

    async getProjects(): Promise<DidaProject[]> {
        let projects: DidaProject[] = [];
        const requestUrl = `https://api.dida365.com/api/v2/projects`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();
            for (let project of resJson) {
                let pItem = new DidaProject();
                pItem.id = project.id;
                pItem.name = project.name;
                projects.push(pItem);
            }
            return projects;
        }

        return projects;
    }

    async getTask(taskId): Promise<DidaSubTask[]> {
        const requestUrl = `https://api.dida365.com/api/v2/task/${taskId}`;
        let tasks: DidaSubTask[] = [];
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();
            for (let taskJson of resJson) {
                let task = new DidaSubTask();
                task.id = taskJson.id;
                task.title = taskJson.title;
                tasks.push(task);
            }
            return tasks;
        }

        return tasks;
    }

    async getJoplinProjectId() {
        const projects = await this.getProjects();
        if (projects) {
            for (let project of projects) {
                if (project.name === DIDA_JOPLIN_PROJECT_NAME) {
                    return project.id;
                }
            }

            return await this.createJoplinProject();
        }
    }

    // async updateJoplinTask(
    //     taskId: string,             // dida task id. It should be stored as the source_url attribute of each note
    //     taskTitle: string,          // dida task title. It should be the same as the note title
    //     subTasks: DidaSubTask[]        // sub dida tasks
    // ) {
    //     let subItems = [];
    //     for (let subTask of subTasks) {
    //         subItems.push({
    //             "id": subTask.id,
    //             "title": subTask.title
    //         });
    //     }
    //
    //     let changeBody = {
    //         "items": subItems,
    //         "title": taskTitle,
    //         "projectId": this.joplinProjectId,
    //         "id": taskId,
    //     };
    //
    //     const requestUrl = `https://api.dida365.com/api/v2/task/${taskId}`;
    //     const response = await fetch(requestUrl, {
    //         headers: this.headers(),
    //         method: 'POST',
    //         body: JSON.stringify(changeBody)
    //     });
    //     if (response.ok) {
    //         console.log('Dida365Lib: update successfully')
    //     } else {
    //         console.log('Dida365Lib: update failed')
    //     }
    // }

    convertTaskToJson(task: DidaTask) {
        let subItems = [];
        for (let subTask of task.items) {
            let subItem = {
                "id": subTask.id,
                "title": subTask.title,
                "status": subTask.status
            };

            if (subTask.startDate) {
                subItem['startDate'] = subTask.startDate.toISOString();
                subItem['isAllDay'] = true;
            }
            subItems.push(subItem);
        }

        let changeBody = {
            "items": subItems,
            "title": task.title,
            "projectId": this.joplinProjectId,
            "status": task.status
        };

        if (task.tags) {
            changeBody['tags'] = Array.from(task.tags);
        }

        return changeBody;
    }

    async createJoplinTask(task: DidaTask) {
        const changeBody = this.convertTaskToJson(task);

        const requestUrl = `https://api.dida365.com/api/v2/task/`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify(changeBody)
        });
        if (response.ok) {
            console.log('Dida365Lib: create successfully')
            return this.buildDidaTaskFromJsonObj(await response.json());
        } else {
            console.log('Dida365Lib: create failed')
            return null;
        }
    }

    async updateJoplinTask(task: DidaTask) {
        const changeBody = this.convertTaskToJson(task);

        const requestUrl = `https://api.dida365.com/api/v2/task/${task.id}`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify(changeBody)
        });
        if (response.ok) {
            console.log('Dida365Lib: update successfully')
            return this.buildDidaTaskFromJsonObj(await response.json());
        } else {
            console.log('Dida365Lib: update failed');
            console.log(changeBody);
        }
    }

    async getJoplinTasks() {
        const requestUrl = `https://api.dida365.com/api/v2/project/${this.joplinProjectId}/tasks`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        let results = [];
        if (response.ok) {
            const resJson = await response.json();
            for (const item of resJson) {
                results.push(this.buildDidaTaskFromJsonObj(item));
            }
        }

        const completedRequestUrl = `https://api.dida365.com/api/v2/project/${this.joplinProjectId}/completed`;
        const completedResponse = await fetch(completedRequestUrl, { headers: this.headers() });
        if (completedResponse.ok) {
            const resJson = await response.json();
            for (const item of resJson) {
                results.push(this.buildDidaTaskFromJsonObj(item));
            }
        }
        return results;
    }

    async batchCheckUpdate() {
        const requestUrl = `https://api.dida365.com/api/v2/batch/check/${this.checkPoint}`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        let tasks = [];
        if (response.ok) {
            const resJson = await response.json();
            this.checkPoint = resJson.checkPoint;

            for (const item of resJson.syncTaskBean.update) {  // current we only care the changes
                if (item.projectId != this.joplinProjectId) {  // ignore the items in other project
                    continue;
                }
                tasks.push(this.buildDidaTaskFromJsonObj(item));
            }
        }
        return tasks;
    }

    buildDidaTaskFromJsonObj(jsonObj) {
        let task = new DidaTask();
        task.id = jsonObj.id;
        task.projectId = jsonObj.projectId;
        task.title = jsonObj.title;
        task.status = jsonObj.status;
        task.items = [];
        if ('tags' in jsonObj) {
            task.tags = new Set(jsonObj.tags);
        } else {
            task.tags = new Set();
        }

        if (jsonObj.items) {
            for (const subItem of jsonObj.items) {
                let subTask = new DidaSubTask();
                subTask.id = subItem.id;
                subTask.title = subItem.title;
                subTask.status = subItem.status;
                task.items.push(subTask);
            }
        }
        return task;
    }
}

export const Dida365 = new Dida365Lib();
