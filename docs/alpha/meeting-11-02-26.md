# DDD CS-07 Meeting 11-0-26

## Next assignment milestone (26th February 2026)

### What's new this time?

- Stories shown through to acceptance criteria through a comprehensive range of prototypes:
    - This means we need to start working towards at minimum an MVP for the project, or a few different prototypes for the different features.
- Underlying software architecture evolving and can be demonstrated:
    - This follows the same principle as the previous point.
- Evidence of Agile metrics:
    - Agile metrics are measurements used to track the performance and progress of Agile software development teams. Common examples include:

        | Metric | Purpose |
        |--------|---------|
        | Velocity | Amount of work completed per sprint |
        | Sprint Burndown | Remaining work vs. time in a sprint |
        | Lead Time | Time from request to delivery |
        | Cycle Time | Time to complete a single task |
        | Team Happiness/Morale | Subjective team well-being |

    We can track these metrics using a tool like Jira (since we are already using Trello), or we can track it manually in a spreadsheet, completing daily logs of completed tasks or story points, and then using a formula to calculate the metrics.

### What's the same as last time?

- Roadmap

- Project Boards

- Evidence of Retros

- Definitions of Done (DoD)

### What are the immediate next steps?

- Create a spec sheet that describes the project in detail to the full extent.
- Using that spec, we can break it down into proper tasks to link to Trello (and Jira if we use that)
- We don't need to assign all the tasks, just a few, and then we can pick up whichever ones we want next. As the project nears the finish line, we will then start to assign again.

A few key tasks to get started on:
- Create a MVP app (using Capacitor) that takes an iCal URL, and then displays the events as a calendar. The logic for iCal processing should NOT be done on device. We need a backend, it doesn't matter how it's done, as long as it's done; Dotnet or TypeScript (Elysia) preferably.
- Concept art and UI design! I'm not an artist and don't know the process behind this so I'll leave it to the experts.
- Investigate Canvas API/hooks to see how (if possible) we can integrate assignments etc.

### Software that I think is interesting and could be useful:
- [Better Auth](https://www.better-auth.com/) — Modern and easy (and framework agnostic) auth solution
- [@facehash/core](https://facehash.roshanc.com/) — Something I found on Twitter and have adjusted to be framework agnostic

