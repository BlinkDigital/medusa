import qs from "qs"
import { useMemo, useReducer } from "react"

type CustomerFilterAction =
  | { type: "setQuery"; payload: string | null }
  | { type: "setUser"; payload: string | null }
  | { type: "setFilters"; payload: CustomerFilterState }
  | { type: "reset"; payload: CustomerFilterState }
  | { type: "setOffset"; payload: number }
  | { type: "setDefaults"; payload: CustomerDefaultFilters | null }

interface CustomerFilterState {
  query?: string | null
  limit: number
  offset: number
  user_id?: string | null,
  additionalFilters: CustomerDefaultFilters | null
}

const allowedFilters = ["q", "offset", "limit", "user_id"]

const reducer = (
  state: CustomerFilterState,
  action: CustomerFilterAction
): CustomerFilterState => {
  switch (action.type) {
    case "setFilters": {
      return {
        ...state,
        query: action?.payload?.query,
      }
    }
    case "setQuery": {
      return {
        ...state,
        offset: 0, // reset offset when query changes
        query: action.payload,
      }
    }
    case "setUser": {
      return {
        ...state,
        offset: 0,
        user_id: action.payload
      }
    }
    case "setOffset": {
      return {
        ...state,
        offset: action.payload,
      }
    }
    case "reset": {
      return action.payload
    }
    default: {
      return state
    }
  }
}

type CustomerDefaultFilters = {
  expand?: string
  fields?: string
}

export const useCustomerFilters = (
  existing?: string,
  defaultFilters: CustomerDefaultFilters | null = null
) => {
  if (existing && existing[0] === "?") {
    existing = existing.substring(1)
  }

  const initial = useMemo(
    () => parseQueryString(existing, defaultFilters),
    [existing, defaultFilters]
  )

  const [state, dispatch] = useReducer(reducer, initial)

  const setDefaultFilters = (filters: CustomerDefaultFilters | null) => {
    dispatch({ type: "setDefaults", payload: filters })
  }

  const paginate = (direction: 1 | -1) => {
    if (direction > 0) {
      const nextOffset = state.offset + state.limit

      dispatch({ type: "setOffset", payload: nextOffset })
    } else {
      const nextOffset = Math.max(state.offset - state.limit, 0)
      dispatch({ type: "setOffset", payload: nextOffset })
    }
  }

  const reset = () => {
    dispatch({
      type: "setFilters",
      payload: {
        ...state,
        offset: 0,
        query: null,
        user_id: null
      },
    })
  }

  const setFilters = (filters: CustomerFilterState) => {
    dispatch({ type: "setFilters", payload: filters })
  }

  const setQuery = (queryString: string | null) => {
    dispatch({ type: "setQuery", payload: queryString })
  }

  const setUser = (userId: string | null) => {
    dispatch({ type: "setUser", payload: userId})
  }

  const getQueryObject = () => {
    const toQuery: any = { ...state.additionalFilters }
    for (const [key, value] of Object.entries(state)) {
      if(key === "user_id") {
        if (value && typeof value === "string") {
          toQuery["user_id"] = value
        }
        continue
      }
      if (key === "query") {
        if (value && typeof value === "string") {
          toQuery["q"] = value
        }
      } else if (key === "offset" || key === "limit") {
        toQuery[key] = value
      }
    }

    return toQuery
  }

  const getQueryString = () => {
    const obj = getQueryObject()
    return qs.stringify(obj, { skipNulls: true })
  }

  const getRepresentationObject = (fromObject?: CustomerFilterState) => {
    const objToUse = fromObject ?? state

    const toQuery: any = {}
    for (const [key, value] of Object.entries(objToUse)) {
      if(key === "user_id") {
        if (value && typeof value === "string") {
          toQuery["user_id"] = value
        }
        continue
      }
      if (key === "query") {
        if (value && typeof value === "string") {
          toQuery["q"] = value
        }
      } else if (key === "offset" || key === "limit" || key === "user_id") {
        toQuery[key] = value
      }
    }

    return toQuery
  }

  const getRepresentationString = () => {
    const obj = getRepresentationObject()
    return qs.stringify(obj, { skipNulls: true })
  }

  const queryObject = useMemo(() => getQueryObject(), [state])
  const representationObject = useMemo(() => getRepresentationObject(), [state])
  const representationString = useMemo(() => getRepresentationString(), [state])

  return {
    ...state,
    filters: {
      ...state,
    },
    representationObject,
    representationString,
    queryObject,
    paginate,
    getQueryObject,
    getQueryString,
    setQuery,
    setUser,
    setFilters,
    setDefaultFilters,
    reset,
  }
}

const parseQueryString = (
  queryString?: string,
  additionals: CustomerDefaultFilters | null = null
): CustomerFilterState => {
  const defaultVal: CustomerFilterState = {
    offset: 0,
    limit: 15,
    additionalFilters: additionals,
  }

  if (queryString) {
    const filters = qs.parse(queryString)
    for (const [key, value] of Object.entries(filters)) {
      if (allowedFilters.includes(key)) {
        switch (key) {
          case "offset": {
            if (typeof value === "string") {
              defaultVal.offset = parseInt(value)
            }
            break
          }
          case "limit": {
            if (typeof value === "string") {
              defaultVal.limit = parseInt(value)
            }
            break
          }
          case "q": {
            if (typeof value === "string") {
              defaultVal.query = value
            }
            break
          }
          case "user_id": {
            if(typeof value === "string") {
              defaultVal.user_id = value
            }
            break
          }
          default: {
            break
          }
        }
      }
    }
  }

  return defaultVal
}
