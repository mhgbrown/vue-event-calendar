<template>
  <div class="cal-wrapper">
    <div class="cal-header">
      <div class="l" @click="preMonth"><div class="arrow-left icon">&nbsp</div></div>
      <div class="title">{{curYearMonth}}</div>
      <div class="r" @click="nextMonth"><div class="arrow-right icon">&nbsp</div></div>
    </div>
    <div class="cal-body">
      <div class="weeks">
        <span
          v-for="(dayName, dayIndex) in i18n[calendar.options.locale].dayNames"
          class="item">
          {{i18n[calendar.options.locale].dayNames[(dayIndex + calendar.options.weekStartOn) % 7]}}
        </span>
      </div>
      <v-touch
      v-on:pan="onPan"
      v-on:panstart="onPanStart"
      v-on:panend="onPanEnd"
      v-bind:pan-options="{ direction: 'horizontal' }"
      >
        <div ref="datesContainer" class="dates-container" :style="{ transform: `translate3d(${deltaX}px, 0, 0)`, webkitTransform: `translate3d(${deltaX}px, 0, 0)`}" :class="{ 'panning': panning, 'navigate-past-disabled': !canNavigatePast, 'navigate-future-disabled': !canNavigateFuture }" @transitionend="onTransitionEnd">
          <div
            v-for="month in dayList"
            class="dates"
            :class="{'future-dates': isFuture(month.month, month.year), 'past-dates': isPast(month.month, month.year), 'current-dates': isCurrent(month.month, month.year)}">
            <div v-for="date in month.dates" class="item"
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
              <span v-if="date.date.split('/')[2] === '1' && shouldShowMonthLabels && (date.status === 1 || shouldShowOverlappingMonths)" class="month-label">{{ monthAbbrev(date.date.split('/')[1]) }}</span>
              <span v-if="date.status ? (today == date.date) : false" class="is-today" :style="{backgroundColor: customColor }" ></span>
              <span v-if="date.status ? (date.title != undefined) : false" class="is-event"
                :style="{borderColor: customColor, backgroundColor: (date.date == selectedDay) ? customColor : 'inherit'}"></span>
              <slot :date="date"></slot>
            </div>
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
      i18n,
      deltaX: 0,
      panning: false,
      ticking: false,
      animationFrame: null
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
        let dateObj = new Date()
        let months = []
        for (let i = -2; i <= 2; i++) {
          let month = (12 + this.calendar.params.curMonth + i) % 12
          let year = this.calendar.params.curYear

          if (this.calendar.params.curMonth + i < 0) {
            year = this.calendar.params.curYear - 1
          } else if (this.calendar.params.curMonth + i > 11) {
            year = this.calendar.params.curYear + 1
          }

          months.push({
            month,
            year
          })
        }

        for(let m = 0; m < months.length; m++) {
          let firstDay = new Date(months[m].year, months[m].month, 1)
          let dayOfWeek = firstDay.getDay()
          // 根据当前日期计算偏移量
          if (this.calendar.options.weekStartOn > dayOfWeek) {
            dayOfWeek = dayOfWeek - this.calendar.options.weekStartOn + 7
          } else if (this.calendar.options.weekStartOn < dayOfWeek) {
            dayOfWeek = dayOfWeek - this.calendar.options.weekStartOn
          }

          let startDate = new Date(firstDay)
          startDate.setDate(firstDay.getDate() - dayOfWeek)

          let item, status, tempArr = [], tempItem
          for (let i = 0 ; i < 42 ; i++) {
              item = new Date(startDate);
              item.setDate(startDate.getDate() + i);

              if (months[m].month === item.getMonth()) {
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
                if (
                  isEqualDateStr(event.date, tempItem.date) && (months[m].month === item.getMonth() ||
                  (months[m].month !== item.getMonth() && this.shouldShowOverlappingMonths))
                ) {
                  tempItem.title = event.title
                  tempItem.desc = event.desc || ''
                  tempItem.data = event.data
                }
              })
              tempArr.push(tempItem)
          }

          months[m].dates = tempArr
        }

        return months
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
    },
    canNavigateFuture () {
      return this.calendar.options.canNavigateFuture
    },
    canNavigatePast () {
      return this.calendar.options.canNavigatePast
    },
    onCurrentMonth () {
      let dateObj = new Date()
      return this.calendar.params.curMonth === dateObj.getMonth() && this.calendar.params.curYear === dateObj.getFullYear()
    }
  },
  methods: {
    isFuture (month, year) {
      let dateObj = new Date()
      return (month > dateObj.getMonth() && year === dateObj.getFullYear()) || year > dateObj.getFullYear()
    },
    isPast (month, year) {
      let dateObj = new Date()
      return (month < dateObj.getMonth() && year === dateObj.getFullYear()) || year < dateObj.getFullYear()
    },
    isCurrent (month, year) {
      let dateObj = new Date()
      return month === dateObj.getMonth() && year === dateObj.getFullYear()
    },
    monthAbbrev (month) {
      return this.i18n[this.calendar.options.locale].monthNamesShort[parseInt(month, 10) - 1]
    },
    nextMonth () {
      if(!this.$EventCalendar.nextMonth()) {
        return
      }

      this.$emit('month-changed', this.curYearMonth)
    },
    preMonth () {
      if(!this.$EventCalendar.preMonth()) {
        return
      }

      this.$emit('month-changed', this.curYearMonth)
    },
    handleChangeCurday (date, event) {
      if (date.status) {
        this.$emit('cur-day-changed', date.date, event)
      }
    },
    onPanStart (event) {
      this.panning = true
    },
    onPan (event) {
      if (this.ticking) {
        return
      }

      this.ticking = true
      this.animationFrame = window.requestAnimationFrame(() => this.onPanUpdate(event))
    },
    onPanUpdate(event) {
      let newDeltaX = event.deltaX

      if (this.onCurrentMonth &&
          (!this.calendar.options.canNavigateFuture && event.deltaX < 0 ||
          !this.calendar.options.canNavigatePast && event.deltaX > 0)) {
        event.preventDefault()
        newDeltaX = 0
      }

      this.deltaX = newDeltaX
      this.ticking = false
    },
    onPanEnd (event) {
      this.panning = false

      window.cancelAnimationFrame(this.animationFrame)

      let deltaX = Math.abs(this.deltaX / this.$refs.datesContainer.offsetWidth)
      let rest = deltaX - 0.5
      let deltaXSign = this.deltaX < 0 ? -1 : 1

      if (deltaX > 0.5) {
        this.deltaX = this.$refs.datesContainer.offsetWidth * (1 + Math.round(rest)) * deltaXSign
      } else {
        this.deltaX = 0
      }

      this.ticking = false
    },
    onTransitionEnd (event) {
      if (this.panning) {
        return
      }

      let monthDelta = this.deltaX / this.$refs.datesContainer.offsetWidth
      let times = Math.abs(monthDelta)

      if (monthDelta < 0) {
        this.panning = true
        // FIXME instead just jump to the month so we don't fire
        // the month changed event twice
        for (let i = 0; i < times; i++) {
          this.nextMonth()
        }
        this.deltaX = 0
      } else if (monthDelta > 0) {
        this.panning = true
        // FIXME instead just jump to the month so we don't fire
        // the month changed event twice
        for (let i = 0; i < times; i++) {
          this.preMonth()
        }
        this.deltaX = 0
      }
    }
  }
}
</script>
