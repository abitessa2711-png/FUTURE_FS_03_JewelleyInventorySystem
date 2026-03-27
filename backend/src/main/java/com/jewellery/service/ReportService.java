package com.jewellery.service;

import com.jewellery.entity.Product;
import com.jewellery.entity.Sale;
import com.jewellery.repository.ProductRepository;
import com.jewellery.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;

    public Map<String, Object> getTodayReport() {
        List<Sale> todaySales = saleRepository.findByDate(LocalDate.now());
        
        long todaySalesCount = todaySales.size(); // Number of bills
        
        double todayTotalAmount = todaySales.stream()
                .mapToDouble(Sale::getTotal)
                .sum();

        double todayTotalWeight = todaySales.stream()
                .filter(s -> s.getWeight() != null)
                .mapToDouble(Sale::getWeight)
                .sum();

        double todayTotalGst = todaySales.stream()
                .filter(s -> s.getGstAmount() != null)
                .mapToDouble(Sale::getGstAmount)
                .sum();

        Map<String, Object> report = new HashMap<>();
        report.put("todaySalesCount", todaySalesCount);
        report.put("todayTotalAmount", todayTotalAmount);
        report.put("todayTotalWeight", todayTotalWeight);
        report.put("todayTotalGst", todayTotalGst);
        return report;
    }

    public List<Sale> getSalesReport() {
        return saleRepository.findAll();
    }

    public List<Product> getStockReport() {
        return productRepository.findAll();
    }
}
