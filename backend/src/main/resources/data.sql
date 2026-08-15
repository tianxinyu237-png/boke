-- Seed data for H2 dev database (Markdown format)
-- Run manually once: connect to H2 console and paste

INSERT INTO posts (slug, title, excerpt, content, date, read_time, cover_image, created_at, updated_at) VALUES
(
  'type-safe-query-builder',
  'Building a type-safe query builder in TypeScript',
  'A deep dive into recursive conditional types, template literal types, and how they compose into a fluent, type-safe SQL-like query API.',
  '## The problem

Raw SQL strings are the default. ORMs abstract them. But neither gives you the compile-time safety you want when building queries dynamically.

## Recursive conditional types

The core insight: TypeScript''s type system is expressive enough to encode SQL semantics. A `SELECT` maps to an object type. A `WHERE` clause narrows it. A `JOIN` merges two object types.

```ts
type Select<T, K extends keyof T> = Pick<T, K>;
```

This post walks through the full implementation, from the basic builder pattern to the advanced recursive types that make it all work.',
  '2026-06-28',
  '12 min',
  'https://picsum.photos/seed/typescript-code/800/400',
  NOW(),
  NOW()
);

INSERT INTO posts (slug, title, excerpt, content, date, read_time, cover_image, created_at, updated_at) VALUES
(
  'java-21-virtual-threads',
  'Understanding the Java 21 virtual threads scheduler',
  'How the JVM''s new virtual threads are scheduled, why carrier threads matter, and what the platform thread pool actually looks like under load.',
  '## Virtual threads are not green threads

Java 21 virtual threads mount onto platform threads (carrier threads) managed by a fork-join pool. When a virtual thread blocks on I/O, it unmounts — the carrier thread picks up another virtual thread.

## The scheduler under load

Under high concurrency, the scheduler''s behavior changes. The default fork-join pool parallelism defaults to `Runtime.availableProcessors()`. This post shows what happens when you have 10,000 virtual threads and 8 carrier threads.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> doWork());
}
```',
  '2026-06-15',
  '9 min',
  'https://picsum.photos/seed/java-threads/800/400',
  NOW(),
  NOW()
);

INSERT INTO posts (slug, title, excerpt, content, date, read_time, cover_image, created_at, updated_at) VALUES
(
  'interval-tree-clocks',
  'A practical introduction to interval tree clocks',
  'ITCs are a compact, precise way to track causality in distributed systems. This post walks through the algorithm with visual examples.',
  '## Why vector clocks are not enough

Vector clocks grow with the number of nodes. In a dynamic system where nodes join and leave, this becomes a memory problem.

## How ITCs work

Interval tree clocks use a tree structure where each node owns a sub-interval of [0,1]. The fork operation splits intervals when new replicas appear. The join operation merges them back.

```rust
// An ITC is just a tree of intervals
struct ITC {
    id: (u64, u64),  // [start, end) sub-interval
    left: Option<Box<ITC>>,
    right: Option<Box<ITC>>,
    event: u64,      // local event counter
}
```',
  '2026-05-30',
  '15 min',
  'https://picsum.photos/seed/distributed-systems/800/400',
  NOW(),
  NOW()
);

-- Insert tags
INSERT INTO post_tags (post_id, tag) VALUES
(1, 'typescript'),
(1, 'type-systems'),
(2, 'java'),
(2, 'concurrency'),
(3, 'distributed-systems'),
(3, 'algorithms');
