//v2.1.0
const ENV = {
    MULTICUBE_NAME: "View cleaner",
    VIEW_NAME: "View cleaner_1",
    FORMAT_FORMULA_MAP: {
        "No Data": null,
        "Date": `DATE("")`,
        "Entity": `""`,
        "Time Entity": `""`,
        "Version": `""`,
        "Line Item Subset": `""`,
        "Number": `0`,
        "Boolean": `FALSE`,
        "Text": `""`
    }
};
const viewInfo = om.environment.get('viewInfo');
if (viewInfo) {
    ENV.MULTICUBE_NAME = viewInfo.contextName;
    ENV.VIEW_NAME = viewInfo.viewName;
}
if (ENV.MULTICUBE_NAME === null) {
    throw new Error('Multicube not valid');
}
class CubeItem {
    constructor(/**CubeInfo*/cubeInfo, formula, conditionFormula) {
        this.name = cubeInfo.name();
        this.identifier = cubeInfo.longId();
        this.cubeHasFormula = cubeInfo.getFormula() !== null;
        this.formula = formula;
        this.conditionFormula = conditionFormula;
    }
    update(tab) {
        if (this.cubeHasFormula) {
            om.common.requestInfo().logStatusMessage(`Cube '${this.name}' ignored`, true);
            return;
        }
        om.common.requestInfo().logStatusMessage(`Update cube '${this.name}' by formula: ${this.formula}`, true);
        tab.cubeCellUpdater(this.identifier)
            .setFormula(this.formula)
            .setConditionFormula(this.conditionFormula)
            .load();
    }
}
class Macros {
    constructor() {
        this.conditionFormula = "";
        /**
         * @type {CubeItem[]}
         */
        this.cubes = [];
    }
    getTab() {
        return om.multicubes.multicubesTab().open(ENV.MULTICUBE_NAME);
    }
    /**
     * @returns {Grid}
     */
    getGrid() {
        return this.getTab().pivot(ENV.VIEW_NAME).withoutValues().create();
    }
    loadConditionFormula() {
        om.common.requestInfo().logStatusMessage(`Load conditional formula`, true);
        let grid = this.getGrid();
        let definitions = grid.getDefinitionInfo();
        definitions.getColumnDimensions().forEach(dimension => {
            if (dimension.getDimensionEntity().name() !== 'Cubes') {
                throw new Error(`Column dimension not valid. Use 'Cubes' dimension please`);
            }
        });
        let formula = [];
        grid.getDefinitionInfo().getPageSelectors().forEach(dimension => {
            if (!dimension.getSelectedEntity()) {
                throw new Error(`View empty`);
            }
            let dimensionName = dimension.getDimensionEntity().name();
            formula.push(`ITEM('${dimensionName}') = '${dimensionName}'.'${dimension.getSelectedEntity().name()}'`);
        });
        this.conditionFormula = formula.join(' AND ');
        om.common.requestInfo().logStatusMessage(`Conditional formula: ${this.conditionFormula}`, true);
    }
    loadCubes() {
        om.common.requestInfo().logStatusMessage(`Load cubes`, true);
        let cubes = [];
        let generator = this.getGrid().range(0, 1, 0, -1).generator();
        for (let chunk of generator) {
            chunk.columns().all().forEach(labels => {
                let cubeInfo = this.getTab().getCubeInfo(labels.first().longId());
                let formatTypeName = cubeInfo.getFormatInfo().getFormatTypeEntity().name();
                if (!ENV.FORMAT_FORMULA_MAP.hasOwnProperty(formatTypeName)) {
                    throw new Error(`Format '${formatTypeName}' formula not found`);
                }
                if (!ENV.FORMAT_FORMULA_MAP[formatTypeName]) {
                    return;
                }
                cubes.push(new CubeItem(
                    cubeInfo,
                    ENV.FORMAT_FORMULA_MAP[formatTypeName],
                    this.conditionFormula
                ));
            });
            break;
        }
        this.cubes = cubes;
        om.common.requestInfo().logStatusMessage(`${this.cubes.length} cubes loaded`, true);
    }
    runCubeUpdaters() {
        om.common.requestInfo().logStatusMessage(`Run cubes updaters`, true);
        this.cubes.forEach(cubeItem => {
            cubeItem.update(this.getTab());
        });
    }
    load() {
        om.common.requestInfo().logStatusMessage(`Multicube: ${ENV.MULTICUBE_NAME}, View: ${ENV.VIEW_NAME}`, true);
        this.loadConditionFormula();
        this.loadCubes();
        this.runCubeUpdaters();
        om.common.requestInfo().logStatusMessage(`Done`, true);
    }
}
(new Macros).load();