import {Component, OnInit, EventEmitter} from '@angular/core';

@Component({
    selector: 'yj-date-picker',
    templateUrl: 'date-picker.component.html',
    styleUrls: ['date-picker.component.css'],
    inputs: ['isHidden'],
    outputs: ['selectDateEvent']
})

export class DatePickerComponent implements OnInit {
    public isHidden:boolean = true;
    public selectDateEvent:EventEmitter<any> = new EventEmitter<any>();

    private dates:Array<Array<Day>> = [[]];
    private titleYear;
    private titleMonth;
    private pickerTitle: string;
    private today;
    private MonthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
    constructor() {
    }

    ngOnInit() {
        for(let i=0; i<6; i++){
            this.dates.push([]);
            for(let j=0; j<7; j++){
                this.dates[i].push();
            }
        }
        this.today = new Date();
        this.titleYear = this.today.getFullYear();
        this.titleMonth = this.today.getMonth()+1;
        this.pickerTitle = this.titleYear + '/' + this.titleMonth
        this.selectDate(new Day(this.today.getDate()));

        this.calCalender();
    }
    //選擇日期
    selectDate(d:Day){
        this.isHidden = true;
        this.selectDateEvent.emit({year: this.titleYear, month: this.titleMonth + (d.num|0), date: d.date});
    }

    onCancel(){
        this.isHidden = true;
        this.selectDateEvent.emit();
    }
    //往前一個月
    increaseMonth(){
        this.titleMonth ++;
        if(this.titleMonth == 13){
            this.titleYear ++;
            this.titleMonth = 1;
        }
        this.pickerTitle = this.titleYear + '/' + this.titleMonth;
        this.calCalender();
    }
    //往後一個月
    decreaseMonth(){
        this.titleMonth --;
        if(this.titleMonth == 0){
            this.titleYear --;
            this.titleMonth = 12;
        }
        this.pickerTitle = this.titleYear + '/' + this.titleMonth;
        this.calCalender();
    }

    calCalender(){
        //清除舊日曆
        this.clearCalender();

        let startTime = new Date(this.titleYear + '/'+ this.titleMonth + '/' + '1');
        //計算該月從星期幾開始
        let startDay = startTime.getDay();
        //計算該月天數
        let monthDays = this.calcMonthEndDay(this.titleYear, this.titleMonth, 0);
        for(let i= 0, k=1; k < (monthDays+1); i++){
            if(i==0) {
                for (let j = 0; j < 7; j++) {
                    //如果該月份不是從禮拜日開始填，則填上一個月的尾
                    if(j<startDay){
                        let lastMonthEndDay = this.calcMonthEndDay(this.titleYear, this.titleMonth, -1);
                        let lastDay = lastMonthEndDay - startDay + j + 1;
                        this.dates[i][j] = new Day(lastDay,this.calcHodiday(this.titleYear,this.titleMonth,lastDay,-1),false, this.calcToday(this.titleYear,this.titleMonth,lastDay,-1),-1)
                    }else{
                        this.dates[i][j] = new Day(k,this.calcHodiday(this.titleYear,this.titleMonth,k,0),true, this.calcToday(this.titleYear,this.titleMonth,k,0),0);
                        k++;
                    }
                }
            }else {
                for (let j = 0, l = 0; j < 7; j++, k++) {
                    //如果該月份的日子沒有塞滿，後續從下一個月的1號開始補
                    if(k>monthDays){
                        this.dates[i][j] = new Day(++l,this.calcHodiday(this.titleYear,this.titleMonth,l,1),false, this.calcToday(this.titleYear,this.titleMonth,l,1),1);
                    }else{
                        this.dates[i][j] = new Day(k,this.calcHodiday(this.titleYear,this.titleMonth,k,0),true, this.calcToday(this.titleYear,this.titleMonth,k,0),0);
                    }
                }
            }
        }
    }

    //計算一個月的總天數，num為擴充數(設-1可算出前一個月的總天數)
    calcMonthEndDay(y, m, num):number{
        let year = y;
        let month = m+num;
        if(month == 0){
            year --;
            month = 12;
        }else if(month == 13){
            year ++;
            month = 1;
        }
        return (year%4==0)&&(month==2)?this.MonthDays[month-1]+1:this.MonthDays[month-1];
    }

    //計算是不是假日
    calcHodiday(y,m,d,num):boolean{
        let year = y;
        let month = m+num;
        if(month == 0){
            year --;
            month = 12;
        }else if(month == 13){
            year ++;
            month = 1;
        }
        let day = new Date(year+'/'+month+'/'+d);

        if(day.getDay()==0 || day.getDay()==6){
            return true;
        }else {
        }
        return false;
    }

    //計算是不是今天
    calcToday(y,m,d,num):boolean{
        let year = y;
        let month = m+num;
        if(month == 0){
            year --;
            month = 12;
        }else if(month == 13){
            year ++;
            month = 1;
        }
        if(year != this.today.getFullYear()){
            return false;
        }
        if(month-1 != this.today.getMonth()){
            return false;
        }
        if(d != this.today.getDate()){
            return false;
        }
        return true;
    }

    //重整日曆
    clearCalender(){
        for(let i=0; i<6; i++){
            for(let j=0; j<7; j++){
                this.dates[i][j] = null;
            }
        }
    }
}

class Day {
    constructor(public date, public isHoliday?:boolean, public isInMonth?:boolean, public isToday?:boolean, public num?){}
}
