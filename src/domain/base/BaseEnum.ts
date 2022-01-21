export default class BaseEnum {
    private static _enumCache = null;

    private static _arrayCache = null;

    static getLabels() {
        return {};
    }

    static getKeys() {
        return Object.keys(this.getLabels());
    }

    static getLabel(id) {
        return this.getLabels()[id] || '';
    }

    static toEnum() {
        if (!this._enumCache) {
            this._enumCache = Object.freeze(
                this.getKeys().reduce((obj, value) => {
                    obj[value] = value;
                    return obj;
                }, {}),
            );
        }
        return this._enumCache;
    }

    static toArray() {
        if (!this._arrayCache) {
            this._arrayCache = Object.freeze(
                Object.entries(this.getLabels()).map(([id, label]) => ({
                    label,
                    id,
                })),
            );
        }
        return this._arrayCache;
    }
}
