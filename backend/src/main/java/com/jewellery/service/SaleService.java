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
        log.info("Processing sale for ProductID: {}", saleRequest.getProductId());

        // 1. Find exact product by ID
        Product product = productRepository.findById(saleRequest.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("❌ பொருள் இல்லை (Product Not Found)"));

        // 2. Validate input values
        if ((saleRequest.getWeight() == null || saleRequest.getWeight() <= 0) && (saleRequest.getQuantity() == null || saleRequest.getQuantity() <= 0)) {
            throw new RuntimeException("❌ எடை (Weight) அல்லது எண்ணிக்கை (Qty) தேவை");
        }
        if (saleRequest.getPricePerGram() == null || saleRequest.getPricePerGram() <= 0) {
            throw new RuntimeException("❌ விலை/g கொடுக்க வேண்டும்");
        }

        // 3. Validate stock
        if (saleRequest.getWeight() != null && product.getWeight() < saleRequest.getWeight()) {
            throw new InsufficientStockException("❌ இருப்பில் போதுமான எடை இல்லை");
        }
        if (saleRequest.getQuantity() != null && product.getQuantity() != null && product.getQuantity() < saleRequest.getQuantity()) {
            throw new InsufficientStockException("❌ இருப்பில் போதுமான எண்ணிக்கை இல்லை");
        }

        // 4. Reduce stock from THIS specific ID
        if (saleRequest.getWeight() != null) {
            product.setWeight(product.getWeight() - saleRequest.getWeight());
        }
        if (saleRequest.getQuantity() != null && product.getQuantity() != null) {
            product.setQuantity(product.getQuantity() - saleRequest.getQuantity());
        }
        
        // If stock becomes zero (or near zero), we could delete it, 
        // but for now keeping it in DB with 0 value is fine for reports.
        productRepository.save(product);

        // 5. Calculate total
        double weight = (saleRequest.getWeight() != null) ? saleRequest.getWeight() : 0;
        double rate = saleRequest.getPricePerGram();
        double subtotal = weight * rate;

        double discAmt = (saleRequest.getDiscountAmount() != null) ? saleRequest.getDiscountAmount() : 0.0;
        double gstAmt = (saleRequest.getGstAmount() != null) ? saleRequest.getGstAmount() : 0.0;
        
        double grandTotal = subtotal - discAmt + gstAmt;

        saleRequest.setSubtotal(subtotal);
        saleRequest.setDiscountAmount(discAmt);
        saleRequest.setGstAmount(gstAmt);
        saleRequest.setTotal(grandTotal);
        saleRequest.setPrice(grandTotal); 
        
        // Copy product details to sale for record keeping
        saleRequest.setCategory(product.getCategory());
        saleRequest.setSubcategory(product.getSubcategory());
        saleRequest.setVariant(product.getVariant());
        saleRequest.setDetail(product.getDetail());
        saleRequest.setProductId(product.getId());
        saleRequest.setDate(LocalDate.now());
        
        Sale savedSale = saleRepository.save(saleRequest);

        // 6. Save ledger
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
