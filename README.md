# Functional Programming for Beginners (part 1)

This post is aimed toward beginning to intermediate JavaScript developers with a few years of experience under their belt.

Functional programming (fp) is getting a lot of attention in the JavaScript community, due to the visibility of libraries such as [ReactJs](https://reactjs.org/), [Redux](https://redux.js.org/) and [Rxjs](https://rxjs-dev.firebaseapp.com/).

But what is fp, how does it differ from typical object oriented programs, and how can it make our programs better? Although
fp can be a complex topic, we'll simplify and discuss three main characteristics of fp:

1. pure functions over side-effects
1. immutability over mutability
1. composition over inheritance

We'll implement a typical programming task in a an object-oriented, procedural style and then transform it to a functional style and continue the refactor in later posts.

Let's imagine we have data in JSON representing employees. For now, we'll fetch it from a file. `employees.json`:

```json
[
  {
    "active": true,
    "socialSecurity": "587-45-6322",
    "firstName": "Mary",
    "lastName": "Jane",
    "pay": [
      12083.33,
      12083.33,
      12083.33,
      11000,
      12102.24,
      12083.33,
      12083.33,
      12083.33,
      20076,
      12083.33,
      12083.33,
      12083.33
    ]
  },
  {
    "active": true,
    "socialSecurity": "165-02-2588",
    "firstName": "John",
    "lastName": "Doe",
    "pay": [
      8333.33,
      8333.33,
      8333.33,
      8021.45,
      7023,
      9023.67,
      8333.33,
      8333.33,
      8333.33,
      6500,
      8333.33,
      8333.33
    ]
  },
  {
    "active": false,
    "socialSecurity": "203-98-7899",
    "firstName": "Robert",
    "lastName": "Brown",
    "pay": [123, 100, 1234]
  }
]
```
We would like to generate a file containing a CSV table with the sum of payments for *active* employees.
The employees should be sorted by last name, and any instance of a social security number should be
censored. When imported into a spreadsheet program the CSV should render like so:

| Last Name  | First Name | Social Security | Total Salary
| ---------- | -----------| ----------------| ------------
| Doe        | John       | xxx-xx-588      | 97234.76
| Jane       | Mary       | xxx-xx-322      | 151928.21

## Prodedural/Object-Oriented, Monolithic Approach

I'll implement this using a somewhat naive object-oriented, procerdual approach. Note that the code we'll develop will 
read like step-by-step instructions (procedural) and will modify instance variables in-place.

```js
const fs = require("fs");

class SalaryReporter {
  constructor(path) {
    // Ignore possible JSON parse errors for now.
    this.employees = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
    this.filterByActive();
    this.sortByLastName();
    this.censor();
    this.employeeSummaryTable = this.makeEmployeeSummaryTable();
  }
  filterByActive() {
    let ret = [];
    for (let empl of this.employees) {
      if (empl.active) {
        ret.push(empl);
      }
    }
    this.employees = ret;
  }
  sortByLastName() {
    this.employees = this.employees.sort((firstEl, secondEl) => {
      if (firstEl.lastName < secondEl.lastName) {
        return -1;
      }
      if (firstEl.lastName > secondEl.lastName) {
        return 1;
      }
      return 0;
    });
  }
  censor() {
    let ret = [];
    for (const empl of this.employees) {
      for (const field in empl) {
        if (typeof empl[field] === "string") {
          empl[field] = empl[field].replace(
            /\d{3}-\d{2}-(\d{4})/,
            (_, lastFour) => {
              return `xxx-xx-${lastFour}`;
            }
          );
        }
      }
      ret.push(empl);
    }
    this.employees = ret;
  }
  /**
   * @returns {Array} - A 2 dim array, with each sub array representing a row
   * of employee data.
   */
  makeEmployeeSummaryTable() {
    // The first row of the return array are the headers
    let ret = [["Last Name", "First Name", "Social Security", "Total Salary"]];
    // For each employee...
    for (let i = 0; i < this.employees.length; i++) {
      const employee = this.employees[i];

      // Only active employees
      if (employee.active) {
        let employeeTotal = 0;

        // Sum the yearly payments
        for (let j = 0; j < employee.pay.length; j++) {
          employeeTotal += employee.pay[j];
        }

        // Add a row with the employee's info, including total salary
        let row = [
          employee.lastName,
          employee.firstName,
          employee.socialSecurity,
          employeeTotal,
        ];
        ret.push(row);
      }
    }
    return ret;
  }
  /**
   * @returns {String} - CSV string
   */
  report(path) {
    fs.writeFileSync(path, this.employeeSummaryTable.join("\n"), {
      encoding: "utf-8",
    });
  }
}
```
A few notes. This implementation:

* performs side effects, namely reading and writing input and output files
* performs multiple mutations on an instance variable (`this.employees`) after it is first parsed from JSON. It then
reads this data structure to create a two-dimensional array of data that the `report` method uses to generate a CSV table.

## A Hierarchical Approach
Now, imagine, we've been asked to also generate an HTML report. A common approach is to create a hierarchy of `SalaryReporter` classes, each one responsible for writing the report in a different way. Let's do that now. Here's a base class for both the CSV reporter and an HTML reporter. We just extracted out the `report` method. Here's the base class:

```js
const fs = require("fs");

class BaseSalaryReporter {
  constructor(path) {
    // Ignore possible JSON parse errors for now.
    this.employees = JSON.parse(fs.readFileSync(path, { encoding: "utf-8" }));
    this.filterByActive();
    this.sortByLastName();
    this.censor();
    this.employeeSummaryTable = this.makeEmployeeSummaryTable();
  }
  filterByActive() {
    let ret = [];
    for (let empl of this.employees) {
      if (empl.active) {
        ret.push(empl);
      }
    }
    this.employees = ret;
  }
  sortByLastName() {
    this.employees = this.employees.sort((firstEl, secondEl) => {
      if (firstEl.lastName < secondEl.lastName) {
        return -1;
      }
      if (firstEl.lastName > secondEl.lastName) {
        return 1;
      }
      return 0;
    });
  }
  censor() {
    let ret = [];
    for (const empl of this.employees) {
      for (const field in empl) {
        if (typeof empl[field] === "string") {
          empl[field] = empl[field].replace(
            /\d{3}-\d{2}-(\d{4})/,
            (_, lastFour) => {
              return `xxx-xx-${lastFour}`;
            }
          );
        }
      }
      ret.push(empl);
    }
    this.employees = ret;
  }
  /**
   * @returns {Array} - A 2 dim array, with each sub array representing a row
   * of employee data.
   */
  makeEmployeeSummaryTable() {
    // The first row of the return array are the headers
    let ret = [["Last Name", "First Name", "Social Security", "Total Salary"]];
    // For each employee...
    for (let i = 0; i < this.employees.length; i++) {
      const employee = this.employees[i];

      // Only active employees
      if (employee.active) {
        let employeeTotal = 0;

        // Sum the yearly payments
        for (let j = 0; j < employee.pay.length; j++) {
          employeeTotal += employee.pay[j];
        }

        // Add a row with the employee's info, including total salary
        let row = [
          employee.lastName,
          employee.firstName,
          employee.socialSecurity,
          employeeTotal,
        ];
        ret.push(row);
      }
    }
    return ret;
  }
}
```

Now, let's extend this base class to write a CSV report. The subclass cares only about it's specialization, writing a CSV file:

```js
...
class SalaryCSVReporter extends SalaryReporter {
  report(path) {
    fs.writeFileSync(path, this.employeeSummaryTable.join("\n"), {
      encoding: "utf-8",
    });
  }
}
```

Now the HTML reporter. We'll, again, subclass `SalaryReporter`, overriding the `report` method to generate an HTML file containing a table:

```js
...
class SalaryHTMLReporter extends BaseSalaryReporter {
  report(path) {
    const date = new Date();
    const headerRow =
      "<tr>" +
      this.employeeSummaryTable[0]
        .map((heading) => `<th>${heading}</th>`)
        .join("") +
      "</tr>";

    const dataRows = this.employeeSummaryTable
      .slice(1) // Everything but the first row
      .map((row) => {
        const cells = row.map((data) => `<td>${data}</td>`).join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    const html = `<html>
      <head>
        <title>Employee Report: ${date}</title>
      </head>
      <body>
        <table>
          <thead>
            ${headerRow}
          </thead>
          <tbody>
            ${dataRows}
          </tbody>
        </table>
      </body>
    </html>`;
    fs.writeFileSync(path, html, { encoding: "utf-8" });
  }
}
```
This is kind of better. Now when we need a new kind of report, we can just write a class that is only concerned
with the report format; however, there are some serious problems with our implementation:

* it's unnecessarily verbose, which makes it hard to read and introduces more opportunties for bugs.
* It mutates local variables including `employeeTotal` (among others) and the instance
variable `employees`. Not only is this unnecessary, it makes it harder to reason about. Who changed what variable? It also contributes to the verbosity as stated above.
* Writing tests is unnecessarily hard. Because we are reading and writing to the file system, we have to ensure those files 
exist, are writable before each test and are removed after.

## A Functional Implementation

Now let's fix these issues by applying the basic characteristics of fp we mentioned in the beginning of this post. But before we get started let's discuss the principles in a bit more detail.

### Pure Functions as Primary Building Blocks

fp emphasizes plain old functions as first-class citizens and the core building blocks of programs. We pass functions to other functions and avoid classes unless absolutely necessary.

We try to program, not only with functions as much as possible, but also with *pure* functions. Pure
functions are functions that given *x* input **always** return the same output, *y*. Pure functions also avoid side-effects which we'll come back to in a later post. This is a pure function:

```js
function sum(x, y) {
  return x + y;
}
```
Given `x=1` and `y=2`, `sum` will *always* return `3`.

This function is impure:

```js
let x = 0;
function increment() {
  return x++;
}
```

`increment`'s return value is dependent on the context of a variable outside its scope. What if someone or something else changes `x`? There are many other examples of impure functions in the wild including functions that write to the file system, connect to network resources, throw exceptions etc.

Why are pure functions so important? Because they:

* are easy to reason about. By substituting a function call with the value it returns, we can easily determine the behavior of the system.
* are easy to test
* facilitate function composition (as explained later)

### Immutability

The second main characteristic of fp is immutability. Immutability means *not* modifying variables in-place, or after they are initialized.  Like using pure functions, immutability makes programs easier to reason about and thus less buggy. Immutability also lends itself to concurrency. It's easier to avoid race conditions if variables aren't man-handled in arbitrary locations.

### Composition over Inheritance

In fp composition is used instead of inheritance. We specialize behavior by plugging smaller functions together in different
wayts to make larger functions using data pipelines.

This is best illustrated by the Unix toolset, which is a collection of small, focused programs that can be strung together. Each program takes from `stdin` and outputs to `stdout`. Unix programs don't care about where they get their input from and where they dump their output.

The power and flexibility of this paradigm comes when we combine these small programs together. For example, to get the first name in alphabetical order of a list of unordered names in a file:

names.txt:
```
Raymond
Cohen
Albert
```
```bash
# read a text file, sort it, and take the first line.
$ cat names.txt | sort | head -n 1
```
sends `Cohen` to `stdout`.

So, functional composition is simply using the output of one function as the input for another. We actually do this all the time, in the form of intermediate variables or nested invocations:

```js
const exclaim = s => `${s}!`;
const upper = s => s.toUpperCase();

let exclaimed = exclaim("get out"); // "get out!"
upper(exclaimed); // "GET OUT!"

// or
upper(exclaim("get out"));
```

But that's not as obvious as Unix pipes, especially when piping together more than two functions. It's not immediately clear that there's a transformation of data, so instead we can leverage a `compose` function that makes this clerer. Ramda's [`compose`](https://ramdajs.com/docs/#compose) function 
will do. 

`compose` takes any number of functions, starting at the right and passes each one's output to the function to the left. Ramda is an fp JavaScript utility library. `compose` returns a new function that is a *composition* of all the passed functions. So instead of the above, we can do this:

```js
import { compose } from "ramda";


const exclaim = s => `${s}!`;
const upper = s => s.toUpperCase();

// Create a new function, yell that's a composition of upper and exclaim
const yell = compose(upper, exclaim);
yell("get out") // "GET OUT!"
```
`yell` receives a string, appends an exlaimation point, then passes that returned string to `upper` which makes it all uppercase.

There's more to function composition than this, but these are the basics. It allows you to write small, focused functions
to build larger functions. The fact that `exclaim` and `upper` are pure functions makes this composition
possible.

## A Functional Implementation

With some theory out of the way, we're ready to refactor. Let's start, for now, by avoiding the cruft of classes and work with plain old functions. If we need to remember state, we'll consider using classes later, but only then.

Our strategy is to create a new function that strings together simple functions together in a pipeline, each one consuming the output of the and feeding its output to the next one. This is how we want to think about it:

Read JSON string
<br>
↓
<br>
Censor social security numbers
<br>
↓
<br>
Parse JSON
<br>
↓
<br>
Filter out inactive employees
<br>
↓
<br>
Sort by last name
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report

### Read the JSON String

We're going to punt here? Why? Because reading the JSON is impure: we have to read from the file system. Of course
impurity is a large part of real-world programming. At some point we have to reach out into the world and affect it.

The point of fp isn't to avoid impurity, rather to isolate it and move it to the periphery of your program logic. In this
case we can assume the caller of our function will get the raw, employee data. We can assume that `fs.readFileSync` is vetted and welltested by the core Nodejs team. Now we will be able to test our program without having the setup/teardown cruft that's required when reading and writing to the filesystem.

<strike>Read JSON string</strike>
<br>
↓
<br>
Censor social security numbers
<br>
↓
<br>
Parse JSON
<br>
↓
<br>
Filter out inactive employees
<br>
↓
<br>
Sort by last name
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report

### Censor Social Security Numbers

This is pretty simple. We just break out what we had into a separate function:

```js
const censor = (s) =>
  s.replace(/\d{3}-\d{2}-(\d{4})/g, (_, lastFour) => `xxx-xx-${lastFour}`);
```
 We are using `replace` on the string, passing a function instead of a replacement string. The function
 grabs the captured last four digits of the social security number.
 
Because it's a small function that only does one thing and because it's pure, imagine how easy it would be to test this in isolation from the rest of the program. There's no setup/teardown and easy to assert against such simple behavior.

<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
Parse JSON
<br>
↓
<br>
Filter out inactive employees
<br>
↓
<br>
Sort by last name
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report

### Parse JSON
Hey, how simple can you get? We already have a function for this, and we don't even have to write it. It's called:
`JSON.parse`.

Let's start to compose what we have together now:

```js
...
// The caller reads the string from `employees.json` and passes it to
// parseEmployees.
const parseEmployees = compose(JSON.parse, censor);
```

We should now be able to read the JSON file and pass the string to `parseEmployees`, getting back an employee object
with all social security numbers censored.

<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
<strike>Parse JSON</strike>
<br>
↓
<br>
Filter out inactive employees
<br>
↓
<br>
Sort by last name
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report

### Filtering for active employees

Next, we want to filter out inactive employees, which we can do so easily using the higher order function (HOF),
`Array.filter`. An HOF is a function that takes a function as an argument. Most HOFs in JavaScript, like `Array.filter`, `Array.map` etc. are pure (e.g. they return new arrays without mutating any variables).

Our filter implementation is so clear, we don't even feel compelled to create a name function for it (at least not yet).
However, we have to import `filter` from ramda because the built-in`Array.filter` is called on an array instance and takes a callback as a parameter. The version of `filter` in ramda makes composition possible by taking two arguments, the callback and the array to filter.

The interesting thing about Ramda's `filter` is that if you pass it only one argument (e.g. the callback), it returns a function that receives the rest of the arguments (the array). Because passing it only one argument returns a function, we can *invoke* it in the composition with the callback and it will return a function that implicitely accepts the array. This is called [currying/partial application](https://blog.bitsrc.io/understanding-currying-in-javascript-ceb2188c339). We'll discuss this more in a future post: 

```js
const { compose, filter } from "ramda";

...
const parseEmployees = compose(
  filter(employee => employee.active),
  JSON.parse,
  censor
);
```
Are you starting to see how declarative this is? Our function definition tells us exactly what's going on, without spilling
out implementation details for all to see. Compare this to the filtering function we wrote earlier.

<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
<strike>Parse JSON</strike>
<br>
↓
<br>
<strike>Filter out inactive employees</strike>
<br>
↓
<br>
Sort by last name
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report

### Sort by Last Name

Now we have a filtered array of censored employee objects. We need to sort the objects by last name. Essentially, we can re-use the sorting function we wrote earlier, leveraging `Array.sort`:

```js
const sortByLastName = (employees) => {
  return employees.sort((firstEl, secondEl) => {
    if (firstEl.lastName < secondEl.lastName) {
      return -1;
    }
    if (firstEl.lastName > secondEl.lastName) {
      return 1;
    }
    return 0;
  });
};
```
Let's add it to our composition:

```js
...
const parseEmployees = compose(
  sortByLastName,
  filter(employee => employee.active),
  JSON.parse,
  censor
);

```

<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
<strike>Parse JSON</strike>
<br>
↓
<br>
<strike>Filter out inactive employees</strike>
<br>
↓
<br>
<strike>Sort by last name</strike>
<br>
↓
<br>
Make tabular data structure
<br>
↓
<br>
Report


### Making the Tabular Data Structure

Next in our pipeline is transforming the employee objects to a two-dimensional array that can represent a table.
We want to return an array of arrays, each sub-array a row of the table. 

Our earlier implementation is problematic for several reasons:

```js
...
makeEmployeeSummaryTable() {
    // The first row of the return array are the headers
    let ret = [["Last Name", "First Name", "Social Security", "Total Salary"]];
    // For each employee...
    for (let i = 0; i < this.employees.length; i++) {
      const employee = this.employees[i];

      // Only active employees
      if (employee.active) {
        let employeeTotal = 0;

        // Sum the yearly payments
        for (let j = 0; j < employee.pay.length; j++) {
          employeeTotal += employee.pay[j];
        }

        // Add a row with the employee's info, including total salary
        let row = [
          employee.lastName,
          employee.firstName,
          employee.socialSecurity,
          employeeTotal,
        ];
        ret.push(row);
      }
    }
    return ret;
  }
```

1. It's verbose.
2. It manually manages loop state. 
3. It mutates local variables.

Let's address these issues by rewriting this with a functional style:

```js
const JSONtoTable = (employees) => {
  return [
    ["Last Name", "First Name", "Total Pay", "Social Security Number"],
  ].concat(
    employees.map((x) => [
      x.lastName,
      x.firstName,
      x.socialSecurity,
      x.pay.reduce((acc, curr) => acc + curr),
    ])
  );
};
```

We `concat` the header row and [`map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) each employee object to a an array whose elements are the
employee properties, including total pay. `map` is a critical tool for functional programmers precicesly because it transforms an existing array and maps (or transforms) it to a new array without mutating any variables.

To sum each employee's payments, we don't mutate an accumulator array to calculate payment totals. Instead we apply the HOF [`reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) function to the employee's `pay` array. `reduce` is another critical HOF that takes as a parameter a reducer function. The reducer function takes an accumulator and current element parameter. It is typically used to operate on arrays and reduce them to one value. In this case we reduce the `pay` array elements to their sum.

 Let's add this to our composition:

```js
...
const parseEmployees = compose(
  JSONToTable,
  sortByLastName,
  filter(employee => employee.active),
  JSON.parse,
  censor
);

```

<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
<strike>Parse JSON</strike>
<br>
↓
<br>
<strike>Filter out inactive employees</strike>
<br>
↓
<br>
<strike>Sort by last name</strike>
<br>
↓
<br>
<strike>Make tabular data structure</strike>
<br>
↓
<br>
Report

### Report

#### CSV

Now that we have a tabular data structure it's easy to output this as CSV or an HTML table. 
To output this data structure to CSV we need to simply join they array on new-lines (actually in production code you'd use a CSV library to cover edge cases). We can use the `join` function from Ramda, which takes the delimiter as the first argument and the array as the last parameter. `Array.join` would not work in our composition because we need the array to be a parameter. Let's add it:

```js
const { compose, filter, join } = require("ramda");

compose(
  join("\n"),
  makeSummaryTable,
  filter(empl => empl.active)
  JSON.parse,
  readFile(`${__dirname}/employees.json`)
);
```

#### CSV

Now that we have CSV as a string, we may want to output the CSV somehow to a file or to the screen. 
Let's just say, for now, we just want to print it to `stdout`. We can simply add `console.log` to the composition:

```js
const { compose, filter, join } = require("ramda");
...
const x = compose(
  join("\n"),
  JSONToTable,
  sortByLastName,
  filter(employee => employee.active),
  JSON.parse,
  censor
);
```

#### HTML

Now for the HTML. This isn't as simple as joining the array on new-lines. We'll re-use the HTML function
that we wrote previously:

```js
const toHTML = (tableData) => {
  const headerRow =
    "<tr>" +
    tableData[0].map((heading) => `<th>${heading}</th>`).join("") +
    "</tr>";

  const dataRows = tableData
    .slice(1) // Everything but the first row
    .map((row) => {
      const cells = row.map((data) => `<td>${data}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
  <table>
    <thead>
      ${headerRow}
    </thead>
    <tbody>
      ${dataRows}
    </tbody>
  </table>`;
};
```
...and we'll replace `join` with this function to make sure it works:

```js
...
const x = compose(
  toHTML,
  // joing("\n")
  JSONToTable,
  sortByLastName,
  filter(employee => employee.active),
  JSON.parse,
  censor
);
```
There we have it. We still have some clean up to do, but we have a working, concise and declarative function.


<strike>Read JSON string</strike>
<br>
↓
<br>
<strike>Censor social security numbers</strike>
<br>
↓
<br>
<strike>Parse JSON</strike>
<br>
↓
<br>
<strike>Filter out inactive employees</strike>
<br>
↓
<br>
<strike>Sort by last name</strike>
<br>
↓
<br>
<strike>Make tabular data structure</strike>
<br>
↓
<br>
<strike>Report</strike>

## Legos
foo

## Last Words
We've accomplished addressing the deficiencies of the procedural style code we wrote at the beginning of the post. The
functional implementation:

1. is more concise, making it easier to quickly grasp and more likely to be correct. There is no unnecessary fluff relating to classes etc. The code is declarative. It reads like a spec rather than a cryptic set of instructions.
1. doesn't rely on or mutate variables outside each function's scope.
1. is more modular. We can easily mix and match functions to achieve specialization instead of using complex inheritance hierarchies.
1. Writing tests is easy because we've walled off side-effects from the rest of the code. Asserting correct behavior
of pure functions is way easier than checking side-effects.
