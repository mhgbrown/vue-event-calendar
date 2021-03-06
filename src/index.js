'use strict'

import vueEventCalendar from './vue-event-calendar.vue'
import VueTouch from 'vue-touch'

function install (Vue, options = {}) {
  const isVueNext = Vue.version.split('.')[0] === '2'
  const inBrowser = typeof window !== 'undefined'
  let dateObj = new Date()
  const DEFAULT_OPTION = {
    locale: 'zh', // en
    color: ' #f29543',
    className:'selected-day',
    monthLabels: false,
    monthOverlap: false,
    canNavigatePast: true,
    canNavigateFuture: true,
    weekStartOn: 0 // 0 mean sunday
  }
  let Calendar = {
    $vm: null,
    bindEventBus (vm) {
      this.$vm = vm
    },
    toDate (dateString) {
      if (dateString === 'all') {
        this.$vm.CALENDAR_EVENTS_DATA.params = {
          curYear: dateObj.getFullYear(),
          curMonth: dateObj.getMonth(),
          curDate: dateObj.getDate(),
          curEventsDate: 'all'
        }
      } else {
        let dateArr = dateString.split('/')
        dateArr = dateArr.map((item) => {
          return parseInt(item, 10)
        })
        this.$vm.CALENDAR_EVENTS_DATA.params = {
          curYear: dateArr[0],
          curMonth: dateArr[1]-1,
          curDate: dateArr[2],
          curEventsDate: dateString
        }
      }
    },
    nextMonth () {
      if (!calendarOptions.canNavigateFuture
        && dateObj.getMonth() === this.$vm.CALENDAR_EVENTS_DATA.params.curMonth
        && dateObj.getFullYear() === this.$vm.CALENDAR_EVENTS_DATA.params.curYear) {
        return false
      }

      if (this.$vm.CALENDAR_EVENTS_DATA.params.curMonth < 11) {
        this.$vm.CALENDAR_EVENTS_DATA.params.curMonth++
      } else {
        this.$vm.CALENDAR_EVENTS_DATA.params.curYear++
        this.$vm.CALENDAR_EVENTS_DATA.params.curMonth = 0
      }

      return true
    },
    preMonth () {
      if (!calendarOptions.canNavigatePast
        && dateObj.getMonth() === this.$vm.CALENDAR_EVENTS_DATA.params.curMonth
        && dateObj.getFullYear() === this.$vm.CALENDAR_EVENTS_DATA.params.curYear) {
        return false
      }

      if (this.$vm.CALENDAR_EVENTS_DATA.params.curMonth > 0) {
        this.$vm.CALENDAR_EVENTS_DATA.params.curMonth--
      } else {
        this.$vm.CALENDAR_EVENTS_DATA.params.curYear--
        this.$vm.CALENDAR_EVENTS_DATA.params.curMonth = 11
      }

      return true
    }
  }

  const calendarOptions = Object.assign(DEFAULT_OPTION, options)

  const VueCalendarBarEventBus = new Vue({
    data: {
      CALENDAR_EVENTS_DATA: {
        options: calendarOptions,
        params: {
          curYear: dateObj.getFullYear(),
          curMonth: dateObj.getMonth(),
          curDate: dateObj.getDate(),
          curEventsDate: 'all'
        }
      }
    }
  })

  if (inBrowser) {
    window.VueCalendarBarEventBus = VueCalendarBarEventBus
    Calendar.bindEventBus(VueCalendarBarEventBus)
  }

  Vue.use(VueTouch, {name: 'v-touch'})

  Vue.component('vue-event-calendar', vueEventCalendar)

  Vue.prototype.$EventCalendar = Calendar
}

export default install

if (typeof module === 'object' && module.exports) {
  module.exports.install = install
}
