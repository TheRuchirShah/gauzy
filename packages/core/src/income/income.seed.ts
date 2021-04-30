import { Connection } from 'typeorm';
import { Income } from './income.entity';
import * as faker from 'faker';
import { IOrganization, IEmployee } from '@gauzy/contracts';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as path from 'path';
import { Tenant } from '../tenant/tenant.entity';
import * as moment from 'moment';
import { environment as env } from '@gauzy/config';

export const createDefaultIncomes = async (
	connection: Connection,
	defaultData: {
		organizations: IOrganization[];
		employees: IEmployee[];
	}
): Promise<Income[]> => {
	let filePath = path.join(
		__dirname,
		...['income-seed-data', 'income-data.csv']
	);
	try {
		filePath = fs.existsSync(filePath)
			? filePath
			: `./income-seed-data/income-data.csv`;
	} catch (error) {
		console.error('Cannot find income data csv');
	}

	const incomeFromFile = [];
	let defaultIncomes = [];

	for (const organization of defaultData.organizations) {
		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (data) => incomeFromFile.push(data))
			.on('end', async () => {
				defaultIncomes = incomeFromFile.map((seedIncome) => {
					const income = new Income();
					const foundEmployee = defaultData.employees.find(
						(emp) => emp.user.email === seedIncome.email
					);

					income.employee = foundEmployee;
					income.clientName = seedIncome.clientName;
					income.organization = organization;
					income.tenant = organization.tenant;
					income.amount = seedIncome.amount;
					income.clientId = faker.datatype
						.number({ min: 10, max: 9999 })
						.toString();
					income.currency =
						seedIncome.currency || env.defaultCurrency;
					income.valueDate = faker.date.between(
						new Date(),
						moment(new Date()).add(10, 'days').toDate()
					);
					income.notes = seedIncome.notes;
					return income;
				});

				await insertIncome(connection, defaultIncomes);
			});
	}

	return defaultIncomes;
};

export const createRandomIncomes = async (
	connection: Connection,
	tenants: Tenant[],
	tenantEmployeeMap: Map<Tenant, IEmployee[]>
): Promise<void> => {
	const clientsArray = ['NA', 'UR', 'CA', 'ET', 'GA'];
	const notesArray = [
		'Great job!',
		'Well done!',
		'Nice!',
		'Done',
		'Great job!'
	];

	const randomIncomes: Income[] = [];
	(tenants || []).forEach((tenant) => {
		const employees = tenantEmployeeMap.get(tenant);
		(employees || []).forEach((employee) => {
			for (let index = 0; index < 100; index++) {
				const income = new Income();
				const currentIndex = faker.datatype.number({
					min: 0,
					max: index % 5
				});
				income.organization = employee.organization;
				income.tenant = tenant;
				income.employee = employee;
				income.clientName = clientsArray[currentIndex];
				income.amount = faker.datatype.number({ min: 10, max: 9999 });
				income.clientId = faker.datatype
					.number({ min: 10, max: 9999 })
					.toString();
				income.currency =
					employee.organization.currency || env.defaultCurrency;
				income.valueDate = faker.date.between(
					new Date(),
					moment(new Date()).add(10, 'days').toDate()
				);
				income.notes = notesArray[currentIndex];
				randomIncomes.push(income);
			}
		});
	});

	await insertIncome(connection, randomIncomes);
	return;
};

const insertIncome = async (
	connection: Connection,
	incomes: Income[]
): Promise<void> => {
	await connection.manager.save(incomes);
};
