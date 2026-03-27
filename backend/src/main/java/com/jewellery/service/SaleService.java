package com.jewellery.service;

import com.jewellery.entity.Ledger;
import com.jewellery.entity.Product;
import com.jewellery.entity.Sale;
import com.jewellery.exception.InsufficientStockException;
import com.jewellery.exception.ProductNotFoundException;
import com.jewellery.repository.LedgerRepository;
import com.jewellery.repository.ProductRepository;
import com.jewellery.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaleService {
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final LedgerRepository ledgerRepository;

    @Transactional
    public Sale processSale(Sale saleRequest) {
        log.info("Processing sale for: {} - {} - {} - {}", saleRequest.getCategory(), saleRequest.getSubcategory(), saleRequest.getVariant(), saleRequest.getDetail());

        // 1. Find product
        Product product = productRepository.findExactProduct(
                saleRequest.getCategory(), saleRequest.getSubcategory(), saleRequest.getVariant(), saleRequest.getDetail())
                .orElseThrow(() -> new ProductNotFoundException("❌ பொருள் இல்லை"));

        // 2. Validate input values
        if ((saleRequest.getWeight() == null || saleRequest.getWeight() <= 0) && (saleRequest.getQuantity() == null || saleRequest.getQuantity() <= 0)) {
            throw new RuntimeException("❌ எடை (Weight) அல்லது எண்ணிக்கை (Qty) தேவை");
        }
        if (saleRequest.getPricePerGram() == null || saleRequest.getPricePerGram() <= 0) {
            throw new RuntimeException("❌ விலை/g கொடுக்க வேண்டும்");
        }

        // 3. Validate stock (weight & quantity)
        if (saleRequest.getWeight() != null && product.getWeight() < saleRequest.getWeight()) {
            throw new InsufficientStockException("❌ இருப்பில் போதுமான எடை இல்லை (Insufficient Weight)");
        }
        if (saleRequest.getQuantity() != null && product.getQuantity() < saleRequest.getQuantity()) {
            throw new InsufficientStockException("❌ இருப்பில் போதுமான எண்ணிக்கை இல்லை (Insufficient Qty)");
        }

        // 4. Reduce stock
        if (saleRequest.getWeight() != null) {
            product.setWeight(product.getWeight() - saleRequest.getWeight());
        }
        if (saleRequest.getQuantity() != null) {
            product.setQuantity(product.getQuantity() - saleRequest.getQuantity());
        }
        productRepository.save(product);

        // 5. Calculate total (GST 3%)
        double weight = (saleRequest.getWeight() != null) ? saleRequest.getWeight() : 0;
        double price = saleRequest.getPricePerGram();
        double subtotal = weight * price;
        
        double discountPercent = (saleRequest.getDiscountPercent() != null) ? saleRequest.getDiscountPercent() : 0;
        double discountAmount = subtotal * (discountPercent / 100);
        
        double taxableAmount = subtotal - discountAmount;
        double gstAmount = taxableAmount * 0.03; // GST 3%
        double grandTotal = taxableAmount + gstAmount;

        saleRequest.setSubtotal(subtotal);
        saleRequest.setDiscountAmount(discountAmount);
        saleRequest.setGstAmount(gstAmount);
        saleRequest.setTotal(grandTotal);
        saleRequest.setPrice(grandTotal); // Compatibility with DB schema
        
        // 6. Save sale
        saleRequest.setProductId(product.getId());
        saleRequest.setDate(LocalDate.now());
        Sale savedSale = saleRepository.save(saleRequest);

        // 5. Save ledger
        Ledger ledger = Ledger.builder()
                .type("SALE")
                .amount(savedSale.getTotal())
                .date(LocalDate.now())
                .build();
        ledgerRepository.save(ledger);

        log.info("Sale processed successfully. SaleID: {}", savedSale.getId());
        return savedSale;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public List<Sale> getTodaySales() {
        return saleRepository.findByDate(LocalDate.now());
    }

    public Sale getSaleById(Long id) {
        return saleRepository.findById(id).orElseThrow(() -> new RuntimeException("Sale not found"));
    }
}
