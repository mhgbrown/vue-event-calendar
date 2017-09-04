<template>
  <div class="cal-wrapper">
    <div class="cal-header">
      <div class="l" @click="preMonth"><div class="arrow-left icon">&nbsp</div></div>
      <div class="title">{{curYearMonth}}</div>
      <div class="r" @click="nextMonth"><div class="arrow-right icon">&nbsp</div></div>
    </div>
    <div class="cal-body">
      <div class="weeks">
        <span v-for="dayName in i18n[calendar.options.locale].dayNames" class="item">{{dayName}}</span>
      </div>
      <v-touch v-on:swipeleft="onSwipeLeft" v-on:swiperight="onSwipeRight">
        <div class="dates" >
          <div v-for="date in dayList" class="item"
            :class="{
              today: date.status ? (today == date.date) : false,
              event: date.status ? (date.title != undefined) : false,
              [calendar.options.className] : (date.date == selectedDay),
              overlap: date.status === 2
            }">
            <p class="date-num"
              @click="handleChangeCurday(date, $event)"
              :style="{color: date.title != undefined ? ((date.date == selectedDay) ? '#fff' : customColor) : 'inherit'}">
              {{date.status ? date.date.split('/')[2] : '&nbsp'}}</p>
            <span v-if="date.date.split('/')[2] === '1' && shouldShowMonthLabels" class="month-label">{{ monthAbbrev(date.date.split('/')[1]) }}</span>
            <span v-if="date.status ? (today == date.date) : false" class="is-today" :style="{backgroundColor: customColor }" ></span>
            <span v-if="date.status ? (date.title != undefined) : false" class="is-event"
              :style="{borderColor: customColor, backgroundColor: (date.date == selectedDay) ? customColor : 'inherit'}"></span>
            <slot :date="date"></slot>
          </div>
        </div>
      </v-touch>
    </div>
  </div>
</template>

<script>
import i18n from '../i18n.js'
import { dateTimeFormatter, isEqualDateStr} from '../tools.js'

const inBrowser = typeof window !== 'undefined'
export default {
  name: 'cal-panel',
  data () {
    return {
      i18n
    }
  },
  props: {
    events: {
      type: Array,
      required: true
    },
    calendar: {
      type: Object,
      required: true
    },
    selectedDay: {
      type: String,
      required: false
    }
  },
  computed: {
    dayList () {
        let firstDay = new Date(this.calendar.params.curYear, this.calendar.params.curMonth, 1)

        let startDate = new Date(firstDay)
        startDate.setDate(firstDay.getDate() - firstDay.getDay())

        let item, status, tempArr = [], tempItem
        for (let i = 0 ; i < 42 ; i++) {
            item = new Date(startDate);
            item.setDate(startDate.getDate() + i);

            if (this.calendar.params.curMonth === item.getMonth()) {
              status = 1
            } else {
              status = this.shouldShowOverlappingMonths ? 2 : 0
            }
            tempItem = {
              date: `${item.getFullYear()}/${item.getMonth()+1}/${item.getDate()}`,
              status: status,
              data: {}
            }
            this.events.forEach((event) => {
              if (isEqualDateStr(event.date, tempItem.date)) {
                tempItem.title = event.title
                tempItem.desc = event.desc || ''
                tempItem.data = event.data
              }
            })
            tempArr.push(tempItem)
        }
        return tempArr
    },
    today () {
      let dateObj = new Date()
      return `${dateObj.getFullYear()}/${dateObj.getMonth()+1}/${dateObj.getDate()}`
    },
    curYearMonth () {
      let tempDate = Date.parse(new Date(`${this.calendar.params.curYear}/${this.calendar.params.curMonth+1}/01`))
      return dateTimeFormatter(tempDate, this.i18n[this.calendar.options.locale].format)
    },
    customColor () {
      return this.calendar.options.color
    },
    shouldShowMonthLabels () {
      return this.calendar.options.monthLabels
    },
    shouldShowOverlappingMonths () {
      return this.calendar.options.monthOverlap
    }
  },
  methods: {
    monthAbbrev (month) {
      return this.i18n[this.calendar.options.locale].monthNamesShort[parseInt(month, 10) - 1]
    },
    nextMonth () {
      this.$EventCalendar.nextMonth()
      this.$emit('month-changed', this.curYearMonth)
    },
    preMonth () {
      this.$EventCalendar.preMonth()
      this.$emit('month-changed', this.curYearMonth)
    },
    handleChangeCurday (date, event) {
      if (date.status) {
        this.$emit('cur-day-changed', date.date, event)
      }
    },
    onSwipeLeft() {
      this.preMonth()
    },
    onSwipeRight() {
      this.nextMonth()
    }
  }
}
</script>
