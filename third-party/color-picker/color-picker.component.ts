import {Component, OnInit, EventEmitter} from '@angular/core';

@Component({
    selector: 'yj-color-picker',
    templateUrl: './color-picker.component.html',
    styleUrls: ['./color-picker.component.css'],
    outputs: ['selectColorEvent'],
    inputs: ['colorList','selectedColor']
})
export class ColorPickerComponent implements OnInit {
    public colorList: Array<string> = ['255,250,147', '188,250,233', '249,208,135'];
    private selectedColor: string = '';
    private panelVisible: string = 'hidden';

    public selectColorEvent: EventEmitter<any> = new EventEmitter<any>();

    constructor() {
    }

    ngOnInit() {
        this.selectedColor = this.colorList[0];
    }

    selectColor(c: string) {
        this.selectedColor = c;
        this.panelVisible = 'hidden';
        this.selectColorEvent.emit(c);
    }

    panelShowup() {
        this.panelVisible = this.panelVisible == 'hidden' ? 'visible' : 'hidden'
    }

    onCancel(){
        this.panelVisible = 'hidden';
        this.selectColorEvent.emit();
    }
}
