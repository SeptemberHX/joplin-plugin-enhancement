import joplin from "api";
import { SettingItemType } from "api/types";
import {
    ENABLE_IMAGE_ENHANCEMENT,
    ENABLE_LOCAL_PDF_PREVIEW,
    ENABLE_MERMAID_FOLDER, ENABLE_QUICK_COMMANDS,
    ENABLE_TABLE_FORMATTER,
    ENABLE_PAPERS, PAPERS_COOKIE, ENABLE_PSEUDOCODE, ENABLE_CUSTOM_STYLE
} from "./common";

export namespace settings {
    const SECTION = 'FeatureSettings';

    export async function register() {
        await joplin.settings.registerSection(SECTION, {
            label: "Joplin Enhancement",
            iconName: "fas fa-tools",
        });

        let PLUGIN_SETTINGS = {};

        PLUGIN_SETTINGS[ENABLE_TABLE_FORMATTER] = {
            value: true,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable table formatter in editor',
            description: "Allow you to navigate between table cells, format table code, add row/column, align, and delete column with shortcut and tool buttons. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_PSEUDOCODE] = {
            value: true,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable pseudocode in fenced code block',
            description: "Render pseudocode in fenced code block by pseudocode.js + Katex. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_MERMAID_FOLDER] = {
            value: false,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable "Auto fold mermaid block in editor"',
            description: "Fold mermaid block in editor for better view. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_LOCAL_PDF_PREVIEW] = {
            value: true,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable "PDF Preview for Local File" in viewer',
            description: "Show preview for local pdf files just like the preview for the attached pdf file. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_IMAGE_ENHANCEMENT] = {
            value: true,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Allow to set image size and caption',
            description: "![Image Caption](path){width=80%}. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_QUICK_COMMANDS] = {
            value: false,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable quick commands for quick input',
            description: "Insert mermaid graph, tables, etc. with /commands. (requires restart)",
        }

        PLUGIN_SETTINGS[ENABLE_PAPERS] = {
            value: false,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable fetch data from ReadCube Papers',
            description: "Fetch your files from ReadCube Papers and create notes for each file. (requires restart)",
        }

        PLUGIN_SETTINGS[PAPERS_COOKIE] = {
            value: '',
            public: true,
            section: SECTION,
            type: SettingItemType.String,
            label: 'Cookie for ReadCube Papers',
            description: "Visit ReadCube Papers web app in your web browser, open development tools and copy your cookies",
        }

        PLUGIN_SETTINGS[ENABLE_CUSTOM_STYLE] = {
            value: false,
            public: true,
            section: SECTION,
            type: SettingItemType.Bool,
            label: 'Enable Custom CSS style',
            description: "Header auto numbering, Times New Roman font family, and more",
        }

        await joplin.settings.registerSettings(PLUGIN_SETTINGS);
    }
}
