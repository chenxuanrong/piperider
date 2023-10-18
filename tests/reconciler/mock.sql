select current_role();
use role data_dept_property_dev;

create or replace table zz_chenxuan_rong_dev.sandbox.test_mock_1 (
    event_id VARCHAR(255),
    customer_id VARCHAR(255),
    event_date TIMESTAMP_LTZ,
    state VARCHAR(255),
    purchase_amount INT
);

create or replace table zz_chenxuan_rong_dev.sandbox.test_mock_2 (
    event_id VARCHAR(255),
    customer_id VARCHAR(255),
    event_date TIMESTAMP_LTZ,
    state VARCHAR(255),
    purchase_amount INT
);

-- Inserting mock data into the events table
INSERT INTO zz_chenxuan_rong_dev.sandbox.test_mock_1 (event_id, customer_id, event_date, state, purchase_amount) VALUES
('E00001', 'C00001', '2023-10-01 08:15:23', 'NY', 150),
('E00002', 'C00002', '2023-10-01 09:20:45', 'CA', 200),
('E00003', 'C00003', '2023-10-01 10:30:12', 'TX', 75),
('E00004', 'C00004', '2023-10-01 11:45:30', 'FL', 300),
('E00100', 'C00100', '2023-10-15 21:55:42', 'CA', 250);


INSERT INTO zz_chenxuan_rong_dev.sandbox.test_mock_2 (event_id, customer_id, event_date, state, purchase_amount) VALUES
('E00001', 'C00001', '2023-10-16 08:15:23', 'TX', 150),
('E00002', 'C00002', '2023-10-16 09:20:45', 'NY', 200),
('E00003', 'C00003', '2023-10-16 10:30:12', 'CA', 90),
('E00004', 'C00004', '2023-10-16 11:45:30', 'FL', 220),
('E00005', 'C00005', '2023-10-17 13:20:18', 'TX', 200),
('E00001', 'C00001', '2023-10-18 14:35:45', 'NY', 170),
('E00002', 'C00007', '2023-10-19 15:40:27', 'CA', 110),
('E00008', 'C00008', '2023-10-20 16:55:33', 'FL', 250),
('E01009', 'C00009', '2023-10-21 18:10:12', 'TX', 130),
('E01010', 'C00010', '2023-10-22 19:25:46', 'NY', 190);

select * from zz_chenxuan_rong_dev.sandbox.test_mock_1;
select * from zz_chenxuan_rong_dev.sandbox.test_mock_2;
