import { Pool } from 'pg';


export default new Pool({
    host: 'ec2-35-153-114-74.compute-1.amazonaws.com',
    database: 'ddkbvpgj5n8mt0',
    user: 'rwjnldekephezm',
    port: 5432,
    password: '210a329c5e9561aa1b8319962101d3604790e515243164f719b5337858328bf1',
    ssl: {
        rejectUnauthorized: false
    }
})