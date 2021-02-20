import * as React from 'react'
import { Components, GroupedVirtuoso } from '../src'
import { useState, useEffect, useCallback } from 'react'
import moment from 'moment'
import { uniqueId } from 'lodash'

const Style = { height: '350px', width: '300px' }

type EventRow = {
  title: string
  date: string
}

export default function App() {
  const THIS_MOMENT = moment()
  const PAGE_SIZE = 50
  const MAX_ITEMS = 1000000
  const [events, setEvents] = useState<EventRow[]>([])
  const [dateGroups, setDateGroups] = useState<string[]>([THIS_MOMENT.clone().startOf('day').toISOString()])
  const [dateGroupCounts, setDateGroupCounts] = useState<number[]>([0])
  const [firstItemIndex, setFirstItemIndex] = useState(MAX_ITEMS)
  const [listKey, setListKey] = useState(uniqueId())

  const components: Partial<Components> = {
    Footer: () => <div>Footer</div>,

    // eslint-disable-next-line @typescript-eslint/ban-types
    List: React.forwardRef(({ style, children }, listRef) => {
      return (
        <div ref={listRef} style={style}>
          {children}
        </div>
      )
    }),

    Item: ({ children, ...props }) => {
      return (
        <div {...props} style={{ margin: 0 }}>
          {children}
        </div>
      )
    },

    Group: ({ children, ...props }) => {
      return (
        <div {...props} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
          {children}
        </div>
      )
    },

    Header: () => {
      return <button onClick={loadMorePastEvents}>Load more...</button>
    },
  }

  const loadMorePastEvents = () => {
    console.log('prependItems()')
    const nextFirstItemIndex = firstItemIndex - PAGE_SIZE
    const updatedEvents = [...events]
    const updatedDateGroups = [...dateGroups]
    const updatedDateGroupCounts = [...dateGroupCounts]

    const pastEvents = loadPastEvents(moment(events[0].date).toISOString(), updatedEvents, updatedDateGroups, updatedDateGroupCounts)

    setTimeout(() => {
      setListKey(uniqueId())
      setFirstItemIndex(() => nextFirstItemIndex)
      setEvents(pastEvents.events)
      setDateGroups(pastEvents.dateGroups)
      setDateGroupCounts(pastEvents.dateGroupCounts)
    }, 5)
  }

  const getEvents = (startDateString: string, direction: 'before' | 'after') => {
    const results = []
    const start = new Date(startDateString)
    const end = new Date(startDateString)
    if (direction == 'after') {
      end.setDate(end.getDate() + 10)
      for (let count = 0; count < PAGE_SIZE; count++) {
        results.push(new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString())
      }
      results.sort((a: string, b: string) => {
        return a < b ? -1 : a > b ? 1 : 0
      })
    } else {
      end.setDate(start.getDate() - 10)
      for (let count = 0; count < PAGE_SIZE; count++) {
        results.push(new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString())
      }
      results.sort((a: string, b: string) => {
        return a > b ? -1 : a < b ? 1 : 0
      })
    }

    return results
  }

  const loadCurrentAndUpcomingEvents = (
    startDate: string,
    updatedEvents: EventRow[],
    updatedDateGroups: string[],
    updatedDateGroupCounts: number[]
  ) => {
    let lastGroup = dateGroups[dateGroups.length - 1]
    const currentAndUpcomingEvents = getEvents(startDate, 'after')
    currentAndUpcomingEvents.forEach((event: string) => {
      const eventsGroup = moment(event).startOf('day').toISOString()
      // We're about to skip a day. Add an empty group.
      while (eventsGroup > moment(lastGroup).add(1, 'd').startOf('day').toISOString()) {
        const emptyGroup = moment(lastGroup).add(1, 'd').startOf('day').toISOString()
        updatedDateGroups.push(emptyGroup)
        updatedDateGroupCounts.push(1)
        updatedEvents.push({
          title: 'NO EVENTS',
          date: '',
        })
        lastGroup = emptyGroup
      }

      // Find existing group
      let existingDateGroupIndex = -1
      const existingDateGroup = updatedDateGroups.find((dateGroup: string, index: number) => {
        if (dateGroup == eventsGroup) {
          existingDateGroupIndex = index
          return true
        }
        return false
      })

      if (existingDateGroupIndex > -1) {
        // If it exists, update the count
        updatedDateGroupCounts[existingDateGroupIndex] = updatedDateGroupCounts[existingDateGroupIndex] + 1
      } else {
        // If it does not, add it and set the count to 1
        updatedDateGroups.push(eventsGroup)
        updatedDateGroupCounts.push(1)
      }

      lastGroup = eventsGroup
      updatedEvents.push({
        title: `Event ${moment(event).format('MMMM Do YYYY, h:mm:ss a')}`,
        date: event,
      })
    })

    return {
      events: updatedEvents,
      dateGroups: updatedDateGroups,
      dateGroupCounts: updatedDateGroupCounts,
    }
  }

  const loadPastEvents = (startDate: string, updatedEvents: EventRow[], updatedDateGroups: string[], updatedDateGroupCounts: number[]) => {
    let lastGroup = dateGroups[dateGroups.length - 1]
    const pastEvents = getEvents(startDate, 'before')

    pastEvents.forEach((event: string) => {
      const eventsGroup = moment(event).startOf('day').toISOString()

      // We're about to skip a day. Add an empty group.
      while (eventsGroup < moment(lastGroup).subtract(1, 'd').startOf('day').toISOString()) {
        const emptyGroup = moment(lastGroup).subtract(1, 'd').startOf('day').toISOString()
        updatedDateGroups.unshift(emptyGroup)
        updatedDateGroupCounts.unshift(1)
        updatedEvents.unshift({
          title: 'NO EVENTS',
          date: '',
        })
        lastGroup = emptyGroup
      }

      // Find existing group
      let existingDateGroupIndex = -1
      const existingDateGroup = updatedDateGroups.find((dateGroup: string, index: number) => {
        if (dateGroup == eventsGroup) {
          existingDateGroupIndex = index
          return true
        }
        return false
      })

      if (existingDateGroupIndex > -1) {
        // If it exists, update the count
        updatedDateGroupCounts[existingDateGroupIndex] = updatedDateGroupCounts[existingDateGroupIndex] + 1
      } else {
        // If it does not, add it and set the count to 1
        updatedDateGroups.unshift(eventsGroup)
        updatedDateGroupCounts.unshift(1)
      }

      lastGroup = eventsGroup
      updatedEvents.unshift({
        title: `Event ${moment(event).format('MMMM Do YYYY, h:mm:ss a')}`,
        date: event,
      })
    })

    return {
      events: updatedEvents,
      dateGroups: updatedDateGroups,
      dateGroupCounts: updatedDateGroupCounts,
    }
  }

  useEffect(() => {
    const updatedDateGroups = []
    const updatedDateGroupCounts = []
    const updatedEvents: EventRow[] = []

    const currentAndFutureEventData = loadCurrentAndUpcomingEvents(
      THIS_MOMENT.clone().startOf('day').toISOString(),
      updatedEvents,
      updatedDateGroups,
      updatedDateGroupCounts
    )

    // const pastEventData = loadPastEvents(
    //   THIS_MOMENT.clone().subtract(1, 'd').endOf('day').toISOString(),
    //   currentAndFutureEventData.events,
    //   currentAndFutureEventData.dateGroups,
    //   currentAndFutureEventData.dateGroupCounts
    // )

    setEvents(currentAndFutureEventData.events)
    setDateGroups(currentAndFutureEventData.dateGroups)
    setDateGroupCounts(currentAndFutureEventData.dateGroupCounts)
  }, [])

  const appendEvents = useCallback(() => {
    return setTimeout(() => {
      const updatedEvents = [...events]
      const updatedDateGroups = [...dateGroups]
      const updatedDateGroupCounts = [...dateGroupCounts]

      const currentAndFutureEventData = loadCurrentAndUpcomingEvents(
        moment(events[events.length - 1].date).toISOString(),
        updatedEvents,
        updatedDateGroups,
        updatedDateGroupCounts
      )

      setEvents(currentAndFutureEventData.events)
      setDateGroups(currentAndFutureEventData.dateGroups)
      setDateGroupCounts(currentAndFutureEventData.dateGroupCounts)
    }, 200)
  }, [events, dateGroups, dateGroupCounts, setEvents, setDateGroups, setDateGroupCounts])

  // const prependItems = useCallback(() => {
  //   console.log('prependItems()')
  //   const nextFirstItemIndex = firstItemIndex - PAGE_SIZE
  //   const updatedEvents = [...events]
  //   const updatedDateGroups = [...dateGroups]
  //   const updatedDateGroupCounts = [...dateGroupCounts]

  //   const pastEvents = loadPastEvents(
  //     moment(events[0].date).toISOString(),
  //     updatedEvents,
  //     updatedDateGroups,
  //     updatedDateGroupCounts
  //   )

  //   setTimeout(() => {
  //     setFirstItemIndex(() => nextFirstItemIndex)
  //     setEvents(pastEvents.events)
  //     setDateGroups(pastEvents.dateGroups)
  //     setDateGroupCounts(pastEvents.dateGroupCounts)
  //   }, 5)

  //   return false
  // }, [
  //   firstItemIndex,
  //   events,
  //   setEvents,
  //   dateGroups,
  //   setDateGroups,
  //   dateGroupCounts,
  //   setDateGroupCounts,
  // ])

  return (
    <GroupedVirtuoso
      // key={listKey}
      components={components}
      //initialTopMostItemIndex={PAGE_SIZE}
      style={Style}
      groupCounts={dateGroupCounts}
      groupContent={(index) => {
        const groupMoment = moment(dateGroups[index])
        return <div>{groupMoment.format('MMM Do YY')}</div>
      }}
      overscan={300}
      endReached={appendEvents}
      // startReached={prependItems}
      data={events}
      // firstItemIndex={firstItemIndex}
      itemContent={(eventIndex: number, groupIndex: number, data: EventRow) => {
        return (
          <div>
            <div>
              {eventIndex}
              {data.title}
            </div>
          </div>
        )
      }}
    />
  )
}
