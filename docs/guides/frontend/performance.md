# Performance Considerations

Performance optimization strategies and patterns.

**Related Documentation:**
- [Frontend Index](./index.md) - Frontend documentation overview
- [Data Flow](./data-flow.md) - Data fetching patterns
- [State Management](./state-management.md) - Redux caching

---

## Memoization

- Use `useMemo` for expensive calculations (e.g., week/day grouping)
- RTK Query automatic memoization for selectors

---

## RTK Query Caching

- Stale-while-revalidate pattern
- Automatic refetch on window focus
- Cache invalidation via tags

---

## Component Optimization

- Memoized selectors (RTK Query automatic)
- Conditional rendering (view mode switching)
- Local state for transient UI

---

**Last Updated**: November 2025

