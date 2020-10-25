# Интренфейсы Scripts API с пояснениями:

##Интерфейс Cell:
```
interface Cell {
    setValue(value: number | string | null);

    getValue(): number | string | null;

    getNativeValue(): number | string | null;

    getTextValue(): number | string | null;

    getContextValue(): string | null;

    definitions(): number[];

    columns(): LabelsGroup;

    rows(): LabelsGroup;

    dropDown(): Labels;

    getFormatType(): string;
}
```
***

##Интерфейс Cells:
```
interface Cells {
    all(): Cell[];

    first(): Cell;

    setValue(value: number | string | null);

    count(): number;

    chunkInstance(): GridRangeChunk;

    getByIndexes(indexes: number[]): Cells | null;
}
```
***
##Интерфейс Label:
```
interface Label {
    longId(): number;

    name(): string;

    code(): string;

    alias(): string | null;

    label(): string | null;

    parentLongId(): number;
}
```
***

  
[Вернуться к содержанию](contents.md)

[Вернуться к оглавлению](index.md)