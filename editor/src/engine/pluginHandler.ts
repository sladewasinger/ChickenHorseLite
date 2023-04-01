export interface Plugin {
    run(): void;
}

export class PluginHandler {
    plugins: Plugin[] = [];

    constructor() {
    }

    addPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    removePlugin(plugin: Plugin) {
        const index = this.plugins.indexOf(plugin);
        if (index > -1) {
            this.plugins.splice(index, 1);
        }
    }

    runPlugins() {
        this.plugins.forEach((plugin) => {
            plugin.run();
        });
    }
}