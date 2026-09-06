import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";

import apiClient from "../../api/apiClient";

import {
  getInventoryItems
} from "../inventory/inventoryService";

import {
  createReturnExchange,
  getReturnEligibility,
  getReturnExchangeById,
  updateReturnExchange
} from "./returnExchangeService";

const reasons=[
  ["SIZE_PROBLEM","Size problem"],
  ["PRODUCT_DEFECT","Product defect"],
  ["CUSTOMER_PREFERENCE","Customer preference"],
  ["WRONG_PRODUCT","Wrong product"],
  ["QUALITY_CONCERN","Quality concern"],
  ["APPROVED_BUYBACK","Approved buyback"],
  ["OTHER","Other"]
];

const conditions=[
  ["GOOD","Good"],
  ["NEEDS_INSPECTION","Needs inspection"],
  ["NEEDS_REPAIR","Needs repair"],
  ["DAMAGED","Damaged"]
];

const dispositions=[
  ["RESTOCK","Restock immediately"],
  ["INSPECTION","Inspection"],
  ["REPAIR","Repair"],
  ["DAMAGED","Damaged"],
  ["RETURN_TO_SUPPLIER","Return to supplier"]
];

function emptyReturnLine(item){
  return{
    originalSaleItem:
      item.originalSaleItem,

    selected:false,

    itemName:
      item.itemName,

    soldQuantity:
      item.soldQuantity,

    remainingReturnableQuantity:
      item.remainingReturnableQuantity,

    unitReturnValue:
      Number(
        item.unitReturnValue||0
      ),

    quantity:
      item.remainingReturnableQuantity>0
        ?1
        :0,

    reason:"CUSTOMER_PREFERENCE",

    condition:"GOOD",

    inventoryDisposition:"RESTOCK"
  };
}

function ReturnExchangeFormPage(){
  const navigate=useNavigate();
  const {id}=useParams();

  const [searchParams]=
    useSearchParams();

  const editing=Boolean(id);

  const requestedSaleId=
    searchParams.get("saleId")||"";

  const requestedType=
    (
      searchParams.get("type")||
      "RETURN"
    ).toUpperCase();

  const [saleId,setSaleId]=
    useState(requestedSaleId);

  const [type,setType]=
    useState(
      requestedType==="EXCHANGE"
        ?"EXCHANGE"
        :"RETURN"
    );

  const [eligibility,setEligibility]=
    useState(null);

  const [returnLines,setReturnLines]=
    useState([]);

  const [
    replacementItems,
    setReplacementItems
  ]=useState([]);

  const [inventory,setInventory]=
    useState([]);

  const [requestedBy,setRequestedBy]=
    useState("");

  const [notes,setNotes]=
    useState("");

  const [loading,setLoading]=
    useState(true);

  const [saving,setSaving]=
    useState(false);

  const [
    pricingReplacement,
    setPricingReplacement
  ]=useState(null);

  const [error,setError]=
    useState("");

  useEffect(()=>{
    initialize();
  },[id]);

  async function initialize(){
    try{
      setLoading(true);
      setError("");

      if(editing){
        const response=
          await getReturnExchangeById(
            id
          );

        const document=
          response.data||response;

        if(document.status!=="DRAFT"){
          throw new Error(
            "Only draft transactions can be edited"
          );
        }

        const documentSaleId=
          document.sale?._id||
          document.sale;

        setSaleId(
          documentSaleId
        );

        setType(
          document.type
        );

        setRequestedBy(
          document.requestedBy||""
        );

        setNotes(
          document.notes||""
        );

        const eligibilityResponse=
          await getReturnEligibility(
            documentSaleId
          );

        const eligibilityData=
          eligibilityResponse.data||
          eligibilityResponse;

        setEligibility(
          eligibilityData
        );

        const existingBySaleItem=
          new Map(
            document.items.map(
              item=>[
                String(
                  item.originalSaleItem
                ),
                item
              ]
            )
          );

        setReturnLines(
          eligibilityData.items.map(
            item=>{
              const existing=
                existingBySaleItem.get(
                  String(
                    item.originalSaleItem
                  )
                );

              if(!existing){
                return emptyReturnLine(
                  item
                );
              }

              return{
                ...emptyReturnLine(
                  item
                ),

                selected:true,

                quantity:
                  existing.quantity,

                reason:
                  existing.reason,

                condition:
                  existing.condition,

                inventoryDisposition:
                  existing.inventoryDisposition
              };
            }
          )
        );

        setReplacementItems(
          document.replacementItems.map(
            item=>({
              jewelryItem:
                item.jewelryItem?._id||
                item.jewelryItem,

              itemName:
                item.itemName,

              quantity:
                item.quantity,

              unitValue:
                Number(
                  item.unitValue||0
                ),

              purity:
                item.jewelryItem?.purity||
                "",

              netGoldWeight:
                item.jewelryItem
                  ?.netGoldWeight||
                0,

              goldRate:null,

              goldValue:null,

              makingCharge:null,

              stonePrice:null
            })
          )
        );
      }else{
        if(!requestedSaleId){
          throw new Error(
            "Open this form from a sales invoice so the original invoice is identified."
          );
        }

        await loadEligibility(
          requestedSaleId
        );
      }

      await loadInventory();
    }catch(err){
      setError(
        err.response?.data?.message||
        err.message||
        "Failed to load return or exchange form"
      );
    }finally{
      setLoading(false);
    }
  }

  async function loadEligibility(
    targetSaleId
  ){
    const response=
      await getReturnEligibility(
        targetSaleId
      );

    const data=
      response.data||response;

    setEligibility(data);

    setReturnLines(
      data.items.map(
        emptyReturnLine
      )
    );
  }

  async function loadInventory(){
    const response=
      await getInventoryItems();

    const data=
      Array.isArray(response)
        ?response
        :response.data||[];

    setInventory(
      data.filter(
        item=>
          item.status==="AVAILABLE"&&
          Number(item.quantity)>0
      )
    );
  }

  function updateReturnLine(
    index,
    field,
    value
  ){
    setReturnLines(
      current=>
        current.map(
          (line,lineIndex)=>
            lineIndex===index
              ?{
                ...line,
                [field]:value
              }
              :line
        )
    );
  }

  function addReplacement(){
    setReplacementItems(
      current=>[
        ...current,
        {
          jewelryItem:"",
          itemName:"",
          quantity:1,
          unitValue:0,
          purity:"",
          netGoldWeight:0,
          goldRate:null,
          goldValue:null,
          makingCharge:null,
          stonePrice:null
        }
      ]
    );
  }

  async function selectReplacement(
    index,
    jewelryItemId
  ){
    if(!jewelryItemId){
      setReplacementItems(
        current=>
          current.map(
            (item,itemIndex)=>
              itemIndex===index
                ?{
                  jewelryItem:"",
                  itemName:"",
                  quantity:1,
                  unitValue:0,
                  purity:"",
                  netGoldWeight:0,
                  goldRate:null,
                  goldValue:null,
                  makingCharge:null,
                  stonePrice:null
                }
                :item
          )
      );

      return;
    }

    try{
      setPricingReplacement(index);
      setError("");

      const inventoryItem=
        inventory.find(
          item=>
            item._id===
            jewelryItemId
        );

      if(!inventoryItem){
        throw new Error(
          "Selected inventory item was not found."
        );
      }

      const response=
        await apiClient.get(
          `/price-calculation/${jewelryItemId}`
        );

      const price=
        response.data.data||
        response.data;

      setReplacementItems(
        current=>
          current.map(
            (item,itemIndex)=>
              itemIndex===index
                ?{
                  ...item,

                  jewelryItem:
                    jewelryItemId,

                  itemName:
                    inventoryItem.name,

                  quantity:
                    item.quantity||1,

                  unitValue:
                    Number(
                      price.finalPrice||0
                    ),

                  purity:
                    price.purity||
                    inventoryItem.purity||
                    "",

                  netGoldWeight:
                    Number(
                      price.netGoldWeight||
                      inventoryItem.netGoldWeight||
                      0
                    ),

                  goldRate:
                    Number(
                      price.goldRate||0
                    ),

                  goldValue:
                    Number(
                      price.goldValue||0
                    ),

                  makingCharge:
                    Number(
                      price.makingCharge||0
                    ),

                  stonePrice:
                    Number(
                      price.stonePrice||0
                    )
                }
                :item
          )
      );
    }catch(err){
      setError(
        err.response?.data?.message||
        err.message||
        "Replacement price calculation failed"
      );

      setReplacementItems(
        current=>
          current.map(
            (item,itemIndex)=>
              itemIndex===index
                ?{
                  ...item,
                  jewelryItem:"",
                  itemName:"",
                  unitValue:0,
                  goldRate:null,
                  goldValue:null,
                  makingCharge:null,
                  stonePrice:null
                }
                :item
          )
      );
    }finally{
      setPricingReplacement(null);
    }
  }

  function updateReplacementQuantity(
    index,
    value
  ){
    setReplacementItems(
      current=>
        current.map(
          (item,itemIndex)=>
            itemIndex===index
              ?{
                ...item,
                quantity:value
              }
              :item
        )
    );
  }

  function removeReplacement(index){
    setReplacementItems(
      current=>
        current.filter(
          (_,itemIndex)=>
            itemIndex!==index
        )
    );
  }

  const selectedReturnLines=
    useMemo(
      ()=>returnLines.filter(
        line=>line.selected
      ),
      [returnLines]
    );

  const returnPreview=
    useMemo(
      ()=>selectedReturnLines.reduce(
        (sum,line)=>
          sum+
          Number(line.quantity||0)*
          Number(
            line.unitReturnValue||0
          ),
        0
      ),
      [selectedReturnLines]
    );

  const replacementPreview=
    useMemo(
      ()=>replacementItems.reduce(
        (sum,item)=>
          sum+
          Number(item.quantity||0)*
          Number(item.unitValue||0),
        0
      ),
      [replacementItems]
    );

  const adjustmentPreview=
    replacementPreview-
    returnPreview;

  async function handleSubmit(event){
    event.preventDefault();

    try{
      setSaving(true);
      setError("");

      const selected=
        returnLines.filter(
          line=>line.selected
        );

      if(selected.length===0){
        throw new Error(
          "Select at least one item to return or exchange."
        );
      }

      for(const line of selected){
        const quantity=
          Number(line.quantity);

        if(
          !Number.isInteger(quantity)||
          quantity<=0||
          quantity>
            Number(
              line.remainingReturnableQuantity
            )
        ){
          throw new Error(
            `Invalid quantity for ${line.itemName}.`
          );
        }
      }

      if(
        type==="EXCHANGE"&&
        replacementItems.length===0
      ){
        throw new Error(
          "Add at least one replacement item for an exchange."
        );
      }

      if(type==="EXCHANGE"){
        for(
          const replacement of
          replacementItems
        ){
          if(
            !replacement.jewelryItem||
            Number(
              replacement.unitValue
            )<=0
          ){
            throw new Error(
              "Every replacement item must have a calculated price."
            );
          }

          const quantity=
            Number(
              replacement.quantity
            );

          if(
            !Number.isInteger(
              quantity
            )||
            quantity<=0
          ){
            throw new Error(
              `Invalid replacement quantity for ${replacement.itemName||"selected item"}.`
            );
          }

          const inventoryItem=
            inventory.find(
              item=>
                item._id===
                replacement.jewelryItem
            );

          if(
            inventoryItem&&
            quantity>
              Number(
                inventoryItem.quantity
              )
          ){
            throw new Error(
              `${inventoryItem.name} has only ${inventoryItem.quantity} unit(s) available.`
            );
          }
        }
      }

      const payload={
        type,

        sale:saleId,

        requestedBy:
          requestedBy.trim(),

        notes:
          notes.trim(),

        items:selected.map(
          line=>({
            originalSaleItem:
              line.originalSaleItem,

            quantity:
              Number(
                line.quantity
              ),

            reason:
              line.reason,

            condition:
              line.condition,

            inventoryDisposition:
              line.inventoryDisposition
          })
        ),

        replacementItems:
          type==="EXCHANGE"
            ?replacementItems.map(
              item=>({
                jewelryItem:
                  item.jewelryItem,

                quantity:
                  Number(
                    item.quantity
                  )
              })
            )
            :[]
      };

      if(!payload.requestedBy){
        throw new Error(
          "Requested by is required."
        );
      }

      const response=
        editing
          ?await updateReturnExchange(
            id,
            payload
          )
          :await createReturnExchange(
            payload
          );

      const document=
        response.data||response;

      navigate(
        `/return-exchanges/${document._id}`
      );
    }catch(err){
      setError(
        err.response?.data?.message||
        err.message||
        "Failed to save transaction"
      );
    }finally{
      setSaving(false);
    }
  }

  if(loading){
    return(
      <div className="card page-card">
        <div className="card-body">
          Loading...
        </div>
      </div>
    );
  }

  return(
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">
            {editing
              ?"Edit Return / Exchange"
              :"New Return / Exchange"}
          </h1>

          {eligibility&&(
            <p className="text-muted mb-0">
              Invoice:{" "}
              <strong>
                {
                  eligibility
                    .sale
                    .invoiceNumber
                }
              </strong>
            </p>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={()=>navigate(-1)}
        >
          Back
        </button>
      </div>

      {error&&(
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {!eligibility?(
        <div className="card page-card">
          <div className="card-body">
            Invoice eligibility information is unavailable.
          </div>
        </div>
      ):(
        <form onSubmit={handleSubmit}>
          <div className="card page-card mb-4">
            <div className="card-body">
              <h5 className="mb-3">
                Transaction Information
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    Type
                  </label>

                  <select
                    className="form-select"
                    value={type}
                    disabled={editing}
                    onChange={event=>{
                      const nextType=
                        event.target.value;

                      setType(
                        nextType
                      );

                      if(
                        nextType==="RETURN"
                      ){
                        setReplacementItems(
                          []
                        );
                      }
                    }}
                  >
                    <option value="RETURN">
                      Return
                    </option>

                    <option value="EXCHANGE">
                      Exchange
                    </option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Requested By
                  </label>

                  <input
                    className="form-control"
                    value={requestedBy}
                    onChange={event=>
                      setRequestedBy(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Current Invoice Due
                  </label>

                  <input
                    className="form-control"
                    value={Number(
                      eligibility.sale.dueAmount||0
                    ).toFixed(2)}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card page-card mb-4">
            <div className="card-body">
              <h5 className="mb-3">
                Original Sale Items
              </h5>

              {returnLines.map(
                (line,index)=>(
                  <div
                    key={line.originalSaleItem}
                    className="return-item-card"
                  >
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`return-${line.originalSaleItem}`}
                        checked={line.selected}
                        disabled={
                          line.remainingReturnableQuantity<=0
                        }
                        onChange={event=>
                          updateReturnLine(
                            index,
                            "selected",
                            event.target.checked
                          )
                        }
                      />

                      <label
                        className="form-check-label fw-semibold"
                        htmlFor={`return-${line.originalSaleItem}`}
                      >
                        {line.itemName}
                      </label>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-2">
                        <label className="form-label">
                          Sold
                        </label>

                        <input
                          className="form-control"
                          value={line.soldQuantity}
                          disabled
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label">
                          Remaining
                        </label>

                        <input
                          className="form-control"
                          value={
                            line.remainingReturnableQuantity
                          }
                          disabled
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label">
                          Return Qty
                        </label>

                        <input
                          type="number"
                          min="1"
                          max={
                            line.remainingReturnableQuantity
                          }
                          className="form-control"
                          value={line.quantity}
                          disabled={!line.selected}
                          onChange={event=>
                            updateReturnLine(
                              index,
                              "quantity",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">
                          Unit Return Value
                        </label>

                        <input
                          className="form-control"
                          value={
                            Number(
                              line.unitReturnValue
                            ).toFixed(2)
                          }
                          disabled
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">
                          Line Return Value
                        </label>

                        <input
                          className="form-control"
                          value={
                            (
                              Number(
                                line.quantity||0
                              )*
                              Number(
                                line.unitReturnValue||0
                              )
                            ).toFixed(2)
                          }
                          disabled
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">
                          Reason
                        </label>

                        <select
                          className="form-select"
                          disabled={!line.selected}
                          value={line.reason}
                          onChange={event=>
                            updateReturnLine(
                              index,
                              "reason",
                              event.target.value
                            )
                          }
                        >
                          {reasons.map(
                            ([value,label])=>(
                              <option
                                value={value}
                                key={value}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">
                          Condition
                        </label>

                        <select
                          className="form-select"
                          disabled={!line.selected}
                          value={line.condition}
                          onChange={event=>{
                            const condition=
                              event.target.value;

                            setReturnLines(
                              current=>
                                current.map(
                                  (
                                    currentLine,
                                    lineIndex
                                  )=>{
                                    if(
                                      lineIndex!==
                                      index
                                    ){
                                      return currentLine;
                                    }

                                    return{
                                      ...currentLine,

                                      condition,

                                      inventoryDisposition:
                                        condition!=="GOOD"&&
                                        currentLine
                                          .inventoryDisposition===
                                        "RESTOCK"
                                          ?"INSPECTION"
                                          :currentLine
                                            .inventoryDisposition
                                    };
                                  }
                                )
                            );
                          }}
                        >
                          {conditions.map(
                            ([value,label])=>(
                              <option
                                value={value}
                                key={value}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">
                          Inventory Disposition
                        </label>

                        <select
                          className="form-select"
                          disabled={!line.selected}
                          value={
                            line.inventoryDisposition
                          }
                          onChange={event=>
                            updateReturnLine(
                              index,
                              "inventoryDisposition",
                              event.target.value
                            )
                          }
                        >
                          {dispositions.map(
                            ([value,label])=>(
                              <option
                                value={value}
                                key={value}
                                disabled={
                                  value==="RESTOCK"&&
                                  line.condition!=="GOOD"
                                }
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {type==="EXCHANGE"&&(
            <div className="card page-card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-1">
                      Replacement Items
                    </h5>

                    <small className="text-muted">
                      Replacement prices are calculated automatically using the active gold rate.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={addReplacement}
                  >
                    Add Replacement
                  </button>
                </div>

                {replacementItems.length===0?(
                  <div className="alert alert-secondary mb-0">
                    No replacement item selected.
                  </div>
                ):(
                  replacementItems.map(
                    (replacement,index)=>(
                      <div
                        className="return-item-card"
                        key={index}
                      >
                        <div className="row g-3 align-items-end">
                          <div className="col-md-5">
                            <label className="form-label">
                              Inventory Item
                            </label>

                            <select
                              className="form-select"
                              value={
                                replacement.jewelryItem
                              }
                              disabled={
                                pricingReplacement===
                                index
                              }
                              onChange={event=>
                                selectReplacement(
                                  index,
                                  event.target.value
                                )
                              }
                              required
                            >
                              <option value="">
                                Select item
                              </option>

                              {inventory.map(
                                item=>(
                                  <option
                                    value={item._id}
                                    key={item._id}
                                  >
                                    {item.sku} - {item.name} ({item.quantity} available)
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="col-md-2">
                            <label className="form-label">
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              value={
                                replacement.quantity
                              }
                              onChange={event=>
                                updateReplacementQuantity(
                                  index,
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label">
                              Unit Value
                            </label>

                            <input
                              className="form-control"
                              value={
                                pricingReplacement===
                                index
                                  ?"Calculating..."
                                  :replacement.jewelryItem
                                    ?Number(
                                      replacement.unitValue||0
                                    ).toFixed(2)
                                    :""
                              }
                              readOnly
                              placeholder="Auto calculated"
                            />
                          </div>

                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-outline-danger w-100"
                              onClick={()=>
                                removeReplacement(
                                  index
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {replacement.jewelryItem&&
                        replacement.goldRate!==null&&(
                          <div className="row g-3 mt-1">
                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Purity
                              </small>

                              <strong>
                                {replacement.purity}
                              </strong>
                            </div>

                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Net Weight
                              </small>

                              <strong>
                                {Number(
                                  replacement.netGoldWeight||0
                                ).toFixed(3)}g
                              </strong>
                            </div>

                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Gold Rate
                              </small>

                              <strong>
                                {Number(
                                  replacement.goldRate||0
                                ).toFixed(2)}
                              </strong>
                            </div>

                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Gold Value
                              </small>

                              <strong>
                                {Number(
                                  replacement.goldValue||0
                                ).toFixed(2)}
                              </strong>
                            </div>

                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Making
                              </small>

                              <strong>
                                {Number(
                                  replacement.makingCharge||0
                                ).toFixed(2)}
                              </strong>
                            </div>

                            <div className="col-md-2">
                              <small className="text-muted d-block">
                                Stone
                              </small>

                              <strong>
                                {Number(
                                  replacement.stonePrice||0
                                ).toFixed(2)}
                              </strong>
                            </div>

                            <div className="col-12">
                              <small className="text-muted">
                                Line replacement value
                              </small>

                              <div className="fw-semibold">
                                {(
                                  Number(
                                    replacement.quantity||0
                                  )*
                                  Number(
                                    replacement.unitValue||0
                                  )
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}

          <div className="card page-card mb-4">
            <div className="card-body">
              <h5 className="mb-3">
                Settlement Preview
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <strong>
                    Return Value
                  </strong>

                  <div className="fs-5">
                    {returnPreview.toFixed(2)}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Replacement Value
                  </strong>

                  <div className="fs-5">
                    {replacementPreview.toFixed(2)}
                  </div>
                </div>

                <div className="col-md-4">
                  <strong>
                    Difference
                  </strong>

                  <div className="fs-5">
                    {adjustmentPreview.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                {type==="EXCHANGE"&&
                adjustmentPreview>0&&(
                  <div className="alert alert-warning mb-0">
                    Customer additional due:{" "}
                    <strong>
                      {adjustmentPreview.toFixed(2)}
                    </strong>
                  </div>
                )}

                {adjustmentPreview<0&&(
                  <div className="alert alert-success mb-0">
                    Value in customer's favor:{" "}
                    <strong>
                      {Math.abs(
                        adjustmentPreview
                      ).toFixed(2)}
                    </strong>
                  </div>
                )}

                {type==="EXCHANGE"&&
                adjustmentPreview===0&&
                replacementItems.length>0&&(
                  <div className="alert alert-info mb-0">
                    Even exchange — no price difference.
                  </div>
                )}
              </div>

              <small className="text-muted d-block mt-3">
                Final values are recalculated and validated by the server before saving and again before completion.
              </small>
            </div>
          </div>

          <div className="card page-card mb-4">
            <div className="card-body">
              <label className="form-label">
                Notes
              </label>

              <textarea
                className="form-control"
                rows="3"
                value={notes}
                onChange={event=>
                  setNotes(
                    event.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-dark"
              type="submit"
              disabled={
                saving||
                pricingReplacement!==null
              }
            >
              {saving
                ?"Saving..."
                :"Save Draft"}
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={()=>navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ReturnExchangeFormPage;