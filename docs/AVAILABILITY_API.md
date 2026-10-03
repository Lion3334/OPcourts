# Santa Monica Volleyball Court Availability — API Notes

How to read Ocean Park beach volleyball court availability from the City of
Santa Monica's reservation site, without a browser and without logging in.

## The site

- Frontend: `https://anc.apm.activecommunities.com/santamonicarecreation/reservation/landing`
- Platform: ActiveNet / Active Communities (JS SPA, app version 26.12.56 at time of writing)
- REST API base: `https://anc.apm.activecommunities.com/santamonicarecreation/rest`
- All availability reads are anonymous GETs. No login, no API key, no CSRF token
  needed. (POST endpoints such as `/reservation/resource/validation` require an
  `X-CSRF-Token` header bound to the session cookie — you don't need them for
  read-only availability.)

## Finding the courts

`POST /reservation/resource` with JSON body `{"keyword": "ocean park"}` returns
all matching facilities. Each item has `id`, `name`, `type_name`, `center_name`.

The 24 volleyball courts (VB#I is beach tennis — excluded):

| Facility ID | Name |
|---|---|
| 168–176, 182, 177, 463, 673–676 | Ocean Park North VB#1 … VB#16 |
| 179, 180, 181, 666, 667, 668, 709, 710 | Ocean Park South VB#A … VB#H |

Full mapping: North VB#1=168, VB#2=169, VB#3=170, VB#4=171, VB#5=172, VB#6=173,
VB#7=174, VB#8=175, VB#9=182, VB#10=176, VB#11=177, VB#12=463, VB#13=673,
VB#14=674, VB#15=675, VB#16=676; South VB#A=179, VB#B=180, VB#C=181, VB#D=666,
VB#E=667, VB#F=668, VB#G=709, VB#H=710.

(IDs are stable facility IDs from the city's database. If the city ever renumbers,
re-run the keyword search above.)

## The availability endpoint

This is the exact call the site's own calendar makes
(`fetchAvailabilityTimeslots` in the frontend bundle):

```
GET /reservation/resource/availability/daily/{facilityId}?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

Example:

```
curl "https://anc.apm.activecommunities.com/santamonicarecreation/rest/reservation/resource/availability/daily/168?start_date=2026-10-04&end_date=2026-10-04"
```

Response shape (trimmed):

```json
{
  "headers": {"response_code": "0000", "response_message": "Successful"},
  "body": {
    "details": {
      "resource_id": 168,
      "daily_details": [
        {
          "date": "2026-10-04",
          "status": 0,
          "times": [
            {"start_time": "08:00:00", "end_time": "21:00:00",
             "available": true, "is_cross_day": false}
          ]
        }
      ]
    }
  }
}
```

## Semantics (verified against the site's UI)

- `status`: `0` = normal bookable day. `5` = past/unbookable day (empty `times`).
- `times[]` lists the day's **open ranges only**. Booked periods are **omitted**,
  never greyed out or labeled. A fully booked stretch simply doesn't appear.
- A court covers your window `[W_start, W_end]` iff some range satisfies
  `range.start <= W_start and range.end >= W_end`.
- Partial overlap (a range touches the window but doesn't cover it) means the
  court is booked for part of your window.
- Typical daily hours are 8:00 AM–9:00 PM (varies by date; the ranges tell you).
- Note: the city marks these courts "Not reservable online" / "Require staff
  approval" — availability is visible anonymously, but booking goes through
  Santa Monica rec staff.

## Classification logic

```
for each court:
    ranges = open ranges for the date            # [] means fully booked
    if any(r.start <= win_start and r.end >= win_end for r in ranges):
        AVAILABLE
    elif any(r overlaps window for r in ranges):
        PARTIAL   # report which sub-range is open
    else:
        BOOKED
```

## Reference implementation

`check_courts.py` in this folder implements the above with `urllib` (stdlib
only): fetches all 24 courts with a small delay between requests, classifies
each against one or more time windows, prints a summary (or `--json`).

```
python3 check_courts.py 2026-10-04 --windows 08:00-10:00 11:00-13:00
```

## How the endpoint was found

The landing page loads a JS bundle from
`https://akamai-anc.apm.activecommunities.com/santamonicarecreation/js/`.
Searching it for `availability` surfaced `fetchAvailabilityTimeslots`, defined
as `GET {siteBase}/rest/reservation/resource/availability/daily/{{resourceId}}?start_date=...&end_date=...&customer_id=...&company_id=...`.
The `customer_id`/`company_id` params are optional for anonymous reads. The
response was then validated court-by-court against the date-picker UI in a
browser (e.g. a day the UI showed as "12:00 PM – 9:00 PM available" returned
exactly `[{"start_time": "12:00:00", "end_time": "21:00:00"}]`).
