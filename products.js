const init = connection =>{
    //create product
    const create = async(data)=>{
        const conn = await connection
        await conn.query('insert into products (product, price) values(?)',data)
    } 
    //remove product
     const remove = async(id) => {
        const conn = await connection
        await conn.query('delete from products where id = ? limit 1', [id])
    }
    //update product
     const update = async(id, data) => {
        const conn = await connection
        await conn.query('update products set product = ? where id = ?', [...data, id])
    }

    //return all images with your related products
     const findImages = async(results)=>{
        const conn = await connection
        const productsIds = results.map(product => product.id).join(',')
        const [images] = await conn.query('select * from images where product_id in ('+ productsIds +') group by product_id')
        const mapImages = images.reduce((before, current )=> {
         return {
            ...before,
            [current.product_id]: current
         }
       },{})
       const products = results.map(product => {
        return {
            ...product,
            images: mapImages[product.id]
         }
       })
          return products

      }

      //return all products
     const findAll = async()=> {
        const conn = await connection
       const [results] = await conn.query('select * from products')

       return findImages(results)
     }

     //return paginated query
     const findAllPaginated = async({pageSize = 1, currentPage = 0}={}) => {
        const conn = await connection
       //primeiro parâmetro pageSize(quantos pulam) o segundo currentPage(qunatos serão mostrados) obs: ${currentPage*pageSIze},${pageSize}
       const [results] = await conn.query( `select * from products limit ${pageSize * currentPage}, ${pageSize+1}`)
       const hasNext = results.length > pageSize
       if(results.length > pageSize){
           results.pop()
       }
       const resultsWithImages = await findImages(results)
   
 
       return {
           data: resultsWithImages,
           hasNext
       }
      
   }
 
     //return products group by category declared
     const findAllByCategory = async(categoryId)=> {
        const conn = await connection
       const [results] = await conn.query('select * from products where id in (select product_id from categories_products where category_id=?)',[categoryId])

       return findImages(results)
      }

      //insert image on product_id declared 
     const addImage = async(productId, data) => {
        const conn = await connection
        await conn.query('insert into images (product_id, description, url) values (?,?,?)', [productId, ...data])
     }

      // update product into declared category
    const updateCategories = async(productId, categoryIds) => {
        const conn = await connection
        //transactions
        await conn.query('  START TRANSACTION')
        await conn.query('delete from categories_products where product_id = ?', [productId])
        for await(const categoryId of categoryIds){
            await conn.query('insert into categories_products (category_id, product_id) values (?,?)',[categoryId, productId])
        }
        await conn.query(' COMMIT') //ROLLBACK
    }


    return {
        create,
        remove,
        update,
        updateCategories,
         findAll,
         findAllByCategory,
         findAllPaginated,
         addImage
    }
}
module.exports = init
