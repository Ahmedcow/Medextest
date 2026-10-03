# MedEx v24 — Exam Image & Persistence Fixes

## Fixes
- Selecting an answer no longer re-renders/replaces the entire exam DOM, so the question illustration is not downloaded/reloaded again.
- Answer feedback and question navigator states are updated in place.
- The active exam is saved to browser localStorage after starting, answering, and moving between questions.
- If the user switches apps, switches browser tabs, backgrounds the browser, closes/reopens the browser, or reloads the page while still on the Exam route, the active exam can be restored.
- The active exam is intentionally cleared when the user navigates to another page inside MedEx, or submits the exam.
- Timer state is restored from the original start timestamp, so backgrounding the browser does not reset the timer.
- Question images are loaded eagerly during the exam.

## Important behavior
The browser/app being in the background does not submit or close the exam. The exam remains active until it is submitted or the user intentionally navigates to another MedEx page.
