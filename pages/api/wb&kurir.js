const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const wb = req.query.wb;         // Waybill (Resi)
        const kurir = req.query.kurir;   // Courier (Kurir)

        if (!wb || !kurir) {
            return res.status(400).json({ status: false, message: 'Waybill dan Kurir harus diisi' });
        }

        const data = {
            wb: wb,
            courier: kurir
        };

        const url = 'https://cek-ongkir.com/awb';

        const response = await axios.post(url, data, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            // Informasi dasar
            const courierName = $('div.panel-heading').text().trim();
            const waybill = $('#summary tr:nth-child(2) td:last-child').text().trim();
            const serviceType = $('#summary tr:nth-child(3) td:last-child').text().trim();
            const weight = $('#summary tr:nth-child(4) td:last-child').text().trim();
            const shippingDate = $('#summary tr:nth-child(5) td:last-child').text().trim();
            const senderName = $('#summary tr:nth-child(6) td:last-child').text().trim();
            const receiverName = $('#summary tr:nth-child(7) td:last-child').text().trim();

            // Mengambil Alamat Pengirim dan Penerima
            const senderLocation = $('tr:contains("Alamat Pengirim") td:last-child').text().trim();
            const receiverLocation = $('tr:contains("Alamat Penerima") td:last-child').text().trim();

            // Parsing detail pengiriman dari tabel Riwayat Pengiriman
            const historyTableRows = $('table.table.table-bordered tr:has(td)').not(':first-child');
            let shippingDetailData = [];

            historyTableRows.each((index, row) => {
                const shippingEvent = $(row).find('td').text().trim();
                if (shippingEvent && !shippingEvent.includes('No. Resi') && !shippingEvent.includes('Jenis Layanan') && !shippingEvent.includes('Berat') && !shippingEvent.includes('Tanggal Pengiriman') && !shippingEvent.includes('Nama Pengirim') && !shippingEvent.includes('Nama Penerima') && !shippingEvent.includes('Asal') && !shippingEvent.includes('Tujuan') && !shippingEvent.includes('Status') && !shippingEvent.includes('Alamat Pengirim') && !shippingEvent.includes('Alamat Penerima')) {
                    shippingDetailData.push({ shippingEvent });
                }
            });

            // Mendapatkan event terakhir
            const latestShippingEvent = shippingDetailData.length > 0
                ? shippingDetailData[shippingDetailData.length - 1].shippingEvent
                : null;

            res.status(200).json({
                status: true,
                info: {
                    senderName,
                    senderLocation,
                    receiverName,
                    receiverLocation
                },
                Expedisi: {
                    nameExpedisi: courierName,
                    waybill: waybill,
                    layanan: serviceType,
                    weight: weight,
                    shippingDate: shippingDate
                },
                detailPengiriman: shippingDetailData,
                latestShippingEvent: latestShippingEvent,
                shippingStatus: "ON PROCESS"
            });
        } else {
            res.status(response.status).json({ status: false, message: `Error: ${response.status}` });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.response ? error.response.data : error.message });
    }
});

module.exports = router;
