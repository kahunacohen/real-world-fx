const fs = require("fs");

class SalaryReporter {
  constructor(path) {
    this.employeesAsStr = fs.readFileSync(path, { encoding: "utf-8" });
    this.censor();
    // Ignore possible JSON parse errors for now.
    this.employees = JSON.parse(this.employeesAsStr);
    this.filterByActive();
    this.sortByLastName();
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
    this.employeesAsStr = this.employeesAsStr.replace(
      /\d{3}-\d{2}-(\d{4})/g,
      (_, lastFour) => {
        return `xxx-xx-${lastFour}`;
      }
    );
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

describe("monolithic SalaryReporter", () => {
  describe("SalaryReporter", () => {
    const outPath = `${__dirname}/employees.csv`;
    beforeEach(() => {
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
      }
    });
    afterEach(() => {
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath);
      }
    });
    it("reports salary as CSV", () => {
      const reporter = new SalaryReporter(`${__dirname}/employees.json`);
      reporter.report(outPath);
      expect(fs.readFileSync(outPath, { encoding: "utf-8" })).toEqual(
        "Last Name,First Name,Social Security,Total Salary\nDoe,John,xxx-xx-2588,97234.76\nJane,Mary,xxx-xx-6322,151928.21"
      );
    });
  });
});

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

class SalaryCSVReporter extends BaseSalaryReporter {
  report(path) {
    fs.writeFileSync(path, this.employeeSummaryTable.join("\n"), {
      encoding: "utf-8",
    });
  }
}

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

describe("Hierachal SalaryReporter", () => {
  const outPathCSV = `${__dirname}/employees.csv`;
  const outPathHTML = `${__dirname}/employees.html`;

  beforeEach(() => {
    if (fs.existsSync(outPathCSV)) {
      fs.unlinkSync(outPathCSV);
    }
    if (fs.existsSync(outPathHTML)) {
      fs.unlinkSync(outPathHTML);
    }
  });
  afterEach(() => {
    if (fs.existsSync(outPathCSV)) {
      fs.unlinkSync(outPathCSV);
    }
    if (fs.existsSync(outPathHTML)) {
      fs.unlinkSync(outPathHTML);
    }
  });
  describe("SalaryCSVReporter", () => {
    it("outputs CSV", () => {
      const reporter = new SalaryCSVReporter(`${__dirname}/employees.json`);
      reporter.report(outPathCSV);
      expect(fs.readFileSync(outPathCSV, { encoding: "utf-8" })).toEqual(
        "Last Name,First Name,Social Security,Total Salary\nDoe,John,xxx-xx-2588,97234.76\nJane,Mary,xxx-xx-6322,151928.21"
      );
    });
  });
  describe("SalaryHTMLReporter", () => {
    it("outputs HTML", () => {
      const reporter = new SalaryHTMLReporter(`${__dirname}/employees.json`);
      reporter.report(outPathHTML);
      // In real life we should parse using a DOM parser and assert.
      expect(fs.readFileSync(outPathHTML, { encoding: "utf-8" })).toEqual(
        expect.stringContaining(
          "<tr><td>Doe</td><td>John</td><td>xxx-xx-2588</td><td>97234.76</td></tr><tr><td>Jane</td><td>Mary</td><td>xxx-xx-6322</td><td>151928.21</td></tr>"
        )
      );
    });
  });
});
